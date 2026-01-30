import {
  getExerciseVideoUrl,
  getTutorialVideoUrl,
} from "@/services/StorageService";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { FC, useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";

type Props = {
  title?: string;
  source: string;
  fullScreenDisabled?: boolean;
  controlsDisabled?: boolean;
  setIsFullScreen?: (isFullScreen: boolean) => void;
  setIsVideoPlaying?: (isPaused: boolean) => void;
  /** Use tutorial_videos bucket instead of exercise_videos bucket */
  isTutorial?: boolean;
  disabled?: boolean;
};

export const VideoPlayer: FC<Props> = ({
  title,
  source,
  setIsVideoPlaying,
  fullScreenDisabled,
  setIsFullScreen,
  controlsDisabled,
  isTutorial,
  disabled = false,
}) => {
  const videoUrl = useMemo(() => {
    // Extract filename from path (e.g., "tutorialVideos/Bankdruecken.mp4" -> "Bankdruecken.mp4")
    const filename = source?.split("/").pop() ?? "";
    if (!filename) return "";
    return isTutorial
      ? getTutorialVideoUrl(filename)
      : getExerciseVideoUrl(filename);
  }, [source, isTutorial]);

  const player = useVideoPlayer(videoUrl);

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    setIsVideoPlaying?.(player.playing);
  }, [isPlaying, player.playing, setIsVideoPlaying]);

  useEffect(() => {
    if (disabled && player.playing) {
      player.pause();
    }
  }, [disabled, player]);

  return (
    <Box aspectRatio={16 / 9}>
      <VideoView
        fullscreenOptions={{ enable: !fullScreenDisabled }}
        onFullscreenEnter={() => {
          setIsFullScreen?.(true);
        }}
        onFullscreenExit={() => {
          setIsFullScreen?.(false);
        }}
        style={styles.videoView}
        nativeControls={!controlsDisabled}
        player={player}
      />
      {!isPlaying && !!title && (
        <Box
          backgroundColor="overlay"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding="s"
        >
          <Text color="white" textAlign="center">
            {title}
          </Text>
        </Box>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  videoView: {
    flex: 1,
  },
});

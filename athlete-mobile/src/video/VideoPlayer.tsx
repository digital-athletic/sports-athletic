import { getExerciseVideoUrl } from "@/services/StorageService";
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
};

export const VideoPlayer: FC<Props> = ({
  title,
  source,
  setIsVideoPlaying,
  fullScreenDisabled,
  setIsFullScreen,
  controlsDisabled,
}) => {
  // Extract filename from path (e.g., "exerciseVideos/1-video-xxx.mp4" -> "1-video-xxx.mp4")
  const videoUrl = useMemo(() => {
    const filename = source?.split("/").pop() ?? "";
    return filename ? getExerciseVideoUrl(filename) : "";
  }, [source]);

  const player = useVideoPlayer(videoUrl);

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    setIsVideoPlaying?.(player.playing);
  }, [isPlaying, player.playing, setIsVideoPlaying]);

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
        //@ts-expect-error additional work needs to be done for web types
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

import { liveRegionProps, useAnnounce } from "@/common/announce";
import {
  getExerciseVideoUrl,
  getTutorialVideoUrl,
} from "@/services/StorageService";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

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
  const { t } = useTranslation();
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const player = useVideoPlayer(videoUrl);

  useEffect(() => {
    setError(null);
    setLoading(true);

    const filename = source?.split("/").pop() ?? "";
    if (!filename) {
      setLoading(false);
      return;
    }

    const getUrl = isTutorial ? getTutorialVideoUrl : getExerciseVideoUrl;

    const loadVideo = async () => {
      try {
        const url = getUrl(filename);
        setVideoUrl(url);
        await player.replaceAsync(url);
        setError(null);
        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const bucketType = isTutorial ? "tutorial_videos" : "exercise_videos";
        console.warn(
          `[VideoPlayer] Failed to load video — bucket: ${bucketType}, file: ${filename}, error: ${message}`,
        );
        setError(t("common.videoLoadError"));
        setLoading(false);
      }
    };

    loadVideo();
  }, [source, isTutorial, player, retryCount, t]);

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  useEffect(() => {
    setIsVideoPlaying?.(isPlaying);
  }, [isPlaying, setIsVideoPlaying]);

  useEffect(() => {
    if (disabled && isPlaying) {
      player.pause();
    }
  }, [disabled, isPlaying, player]);

  useAnnounce(error);

  if (error) {
    return (
      <Box
        aspectRatio={16 / 9}
        backgroundColor="darkGrey3"
        justifyContent="center"
        alignItems="center"
      >
        <Text
          color="lightGrey3"
          textAlign="center"
          marginBottom="s"
          accessibilityRole="alert"
          {...liveRegionProps}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => setRetryCount((c) => c + 1)}
          accessibilityRole="button"
          accessibilityLabel={t("common.retry")}
        >
          <Box
            borderRadius="m"
            paddingHorizontal="m"
            paddingVertical="s"
            backgroundColor="primary"
          >
            <Text color="white">{t("common.retry")}</Text>
          </Box>
        </TouchableOpacity>
      </Box>
    );
  }

  if (loading && !videoUrl) {
    return (
      <Box
        aspectRatio={16 / 9}
        justifyContent="center"
        alignItems="center"
        backgroundColor="darkGrey3"
      >
        <ActivityIndicator />
      </Box>
    );
  }

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

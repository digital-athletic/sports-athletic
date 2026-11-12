import { liveRegionProps, useAnnounce } from "@/common/announce";
import {
  getExerciseVideoUrl,
  getTutorialVideoUrl,
} from "@/services/StorageService";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useWindowClass } from "@/theme/useWindowClass";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

type LoadParams = {
  source: string;
  isTutorial: boolean | undefined;
  retryCount: number;
};

const loadParamsChanged = (prev: LoadParams, next: LoadParams) =>
  prev.source !== next.source ||
  prev.isTutorial !== next.isTutorial ||
  prev.retryCount !== next.retryCount;

const FIXED_FRAME = { aspectRatio: 16 / 9 } as const;

// The video scales to fit inside this frame. A 9:16 video uses the whole column
// height. A 16:9 video sits in the middle with dark bars above and below.
const COLUMN_FRAME = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "scrim",
} as const;

const useVideoFrame = (fillColumnInTallLandscape: boolean | undefined) => {
  const isTallLandscape = useWindowClass() === "tallLandscape";
  return fillColumnInTallLandscape && isTallLandscape
    ? COLUMN_FRAME
    : FIXED_FRAME;
};

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
  /** In tall landscape, fill the column of TallLandscapeColumns instead of a 16:9 box */
  fillColumnInTallLandscape?: boolean;
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
  fillColumnInTallLandscape,
}) => {
  const { t } = useTranslation();
  const frame = useVideoFrame(fillColumnInTallLandscape);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const player = useVideoPlayer(videoUrl);

  const filename = source?.split("/").pop() ?? "";

  // Reset for a new load whenever the source/tutorial-flag/retry changes.
  const [prevLoad, setPrevLoad] = useState({ source, isTutorial, retryCount });
  if (loadParamsChanged(prevLoad, { source, isTutorial, retryCount })) {
    setPrevLoad({ source, isTutorial, retryCount });
    setError(null);
    setLoading(!!filename);
  }

  useEffect(() => {
    const filename = source?.split("/").pop() ?? "";
    if (!filename) {
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
        testID="video-frame"
        {...frame}
        backgroundColor="scrim"
        justifyContent="center"
        alignItems="center"
      >
        <Text
          color="outline"
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
            <Text color="onPrimary">{t("common.retry")}</Text>
          </Box>
        </TouchableOpacity>
      </Box>
    );
  }

  if (loading && !videoUrl) {
    return (
      <Box
        testID="video-frame"
        {...frame}
        justifyContent="center"
        alignItems="center"
        backgroundColor="scrim"
      >
        <ActivityIndicator />
      </Box>
    );
  }

  return (
    <Box testID="video-frame" {...frame}>
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
        <Box position="absolute" bottom={0} left={0} right={0} padding="s">
          <Box
            style={StyleSheet.absoluteFill}
            backgroundColor="scrim"
            opacity={0.8}
          />
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
    // A browser otherwise sizes the video element by the video format. The
    // element then grows out of its frame and covers the text next to it.
    width: "100%",
    minHeight: 0,
  },
});

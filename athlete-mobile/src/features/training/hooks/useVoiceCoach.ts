import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect } from "react";

/**
 * Hook for managing voice coach audio playback during training.
 * Uses expo-audio for cross-platform audio support.
 */
export const useVoiceCoach = (
  isPauseNext: boolean,
  isActive: boolean,
  countdown: number | undefined,
) => {
  const hasCountdown = typeof countdown === "number";

  const startPlayer = useAudioPlayer(
    require("../../../../assets/audio/start_5sec.mp3"),
    {
      // Maintains audio session for seamless handoff to video playback
      keepAudioSessionActive: true,
    },
  );
  const pausePlayer = useAudioPlayer(
    require("../../../../assets/audio/pause_3sec.mp3"),
    {
      // Maintains audio session for seamless handoff to video playback
      keepAudioSessionActive: true,
    },
  );

  const playCountdown = useCallback(
    (remaining: number) => {
      if (isPauseNext && remaining <= 4 && !pausePlayer.playing) {
        pausePlayer.seekTo(Math.max(0, pausePlayer.duration - remaining));
        pausePlayer.play();
      } else if (!isPauseNext && remaining <= 6 && !startPlayer.playing) {
        startPlayer.seekTo(Math.max(0, startPlayer.duration - remaining));
        startPlayer.play();
      }
    },
    [isPauseNext, pausePlayer, startPlayer],
  );

  const stopCountdown = useCallback(() => {
    if (startPlayer.playing) {
      startPlayer.pause();
    }
    if (pausePlayer.playing) {
      pausePlayer.pause();
    }
  }, [pausePlayer, startPlayer]);

  useEffect(() => {
    if (isActive && hasCountdown) {
      playCountdown(countdown!);
    } else {
      stopCountdown();
    }
  }, [countdown, hasCountdown, isActive, playCountdown, stopCountdown]);
};

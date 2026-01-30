import {
  AudioPlayer,
  AudioPlayerOptions,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useCallback, useEffect } from "react";

const playerOptions: AudioPlayerOptions = {
  // Maintains audio session for seamless handoff to video playback
  keepAudioSessionActive: true,
};

const play = (player: AudioPlayer, position?: number) => {
  if (typeof position === "number") {
    player.seekTo(position);
  }
  player.play();
};

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
    playerOptions,
  );
  const { playing: startCoachPlaying, duration: startCoachDuration } =
    useAudioPlayerStatus(startPlayer);

  // Plays start exercise countdown audio clip if within the final 6 seconds
  const playStartCoach = useCallback(
    (remaining: number) => {
      if (remaining <= 6 && !startCoachPlaying) {
        play(startPlayer, Math.max(0, startCoachDuration - remaining));
      }
    },
    [startCoachDuration, startCoachPlaying, startPlayer],
  );

  const pausePlayer = useAudioPlayer(
    require("../../../../assets/audio/pause_3sec.mp3"),
    playerOptions,
  );
  const { playing: pauseCoachPlaying, duration: pauseCoachDuration } =
    useAudioPlayerStatus(pausePlayer);

  // Plays pause countdown audio clip if within the final 4 seconds
  const playPauseCoach = useCallback(
    (remaining: number) => {
      if (remaining <= 4 && !pauseCoachPlaying) {
        play(pausePlayer, Math.max(0, pauseCoachDuration - remaining));
      }
    },
    [pauseCoachDuration, pauseCoachPlaying, pausePlayer],
  );

  const playCountdown = useCallback(
    (remaining: number) => {
      if (isPauseNext) {
        playPauseCoach(remaining);
      } else {
        playStartCoach(remaining);
      }
    },
    [isPauseNext, playPauseCoach, playStartCoach],
  );

  const stopCountdown = useCallback(() => {
    if (startCoachPlaying) {
      startPlayer.pause();
    }
    if (pauseCoachPlaying) {
      pausePlayer.pause();
    }
  }, [pauseCoachPlaying, pausePlayer, startCoachPlaying, startPlayer]);

  useEffect(() => {
    if (isActive && hasCountdown) {
      playCountdown(countdown!);
    } else {
      stopCountdown();
    }
  }, [countdown, hasCountdown, isActive, playCountdown, stopCountdown]);
};

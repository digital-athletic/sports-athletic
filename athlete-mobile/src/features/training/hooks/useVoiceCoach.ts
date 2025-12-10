import { useAudioPlayer } from "expo-audio";

interface VoiceCoachHandle {
  playCountdownToStart: () => void;
  playCountdownToPause: () => void;
  stopVoiceCoach: () => void;
}

/**
 * Hook for managing voice coach audio playback during training.
 * Uses expo-audio for cross-platform audio support.
 */
export const useVoiceCoach = (): VoiceCoachHandle => {
  const startPlayer = useAudioPlayer(
    require("../../../../assets/audio/start_5sec.mp3"),
  );
  const pausePlayer = useAudioPlayer(
    require("../../../../assets/audio/pause_3sec.mp3"),
  );

  const playCountdownToStart = () => {
    startPlayer.seekTo(0);
    startPlayer.play();
  };

  const playCountdownToPause = () => {
    pausePlayer.seekTo(0);
    pausePlayer.play();
  };

  const stopVoiceCoach = () => {
    startPlayer.pause();
    pausePlayer.pause();
  };

  return {
    playCountdownToStart,
    playCountdownToPause,
    stopVoiceCoach,
  };
};

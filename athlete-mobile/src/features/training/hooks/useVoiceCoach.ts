import {
  type AudioPlayer,
  type AudioPlayerOptions,
  useAudioPlayer,
} from "expo-audio";
import { useEffect, useRef } from "react";

const playerOptions: AudioPlayerOptions = {
  // Maintains audio session for seamless handoff to video playback
  keepAudioSessionActive: true,
};

// Seconds left in the exercise when each clip starts.
const START_CUE_LEAD_SECONDS = 6;
const PAUSE_CUE_LEAD_SECONDS = 4;

type StartedCue = {
  exerciseId: string;
  player: AudioPlayer;
};

type VoiceCoachArgs = {
  countdown: number | undefined;
  exerciseId: string;
  isActive: boolean;
  isPauseNext: boolean;
};

const isCountdownInCueWindow = (
  countdown: number | undefined,
  leadSeconds: number,
): countdown is number => countdown !== undefined && countdown <= leadSeconds;

const isCueStartedForExercise = (
  startedCue: StartedCue | undefined,
  exerciseId: string,
  player: AudioPlayer,
) => startedCue?.exerciseId === exerciseId && startedCue.player === player;

// Seeks so that the clip ends together with the countdown.
const playCueFromRemainingSeconds = (
  player: AudioPlayer,
  remaining: number,
) => {
  player.seekTo(Math.max(0, player.duration - remaining));
  player.play();
};

/**
 * Plays the countdown clip for the next exercise once per exercise. A ref
 * records the started clip, because the player status updates asynchronously
 * and would report a finished clip as playable again.
 */
export const useVoiceCoach = ({
  countdown,
  exerciseId,
  isActive,
  isPauseNext,
}: VoiceCoachArgs) => {
  const startPlayer = useAudioPlayer(
    require("../../../../assets/audio/start_5sec.mp3"),
    playerOptions,
  );
  const pausePlayer = useAudioPlayer(
    require("../../../../assets/audio/pause_3sec.mp3"),
    playerOptions,
  );

  const startedCueRef = useRef<StartedCue | undefined>(undefined);

  useEffect(() => {
    const player = isPauseNext ? pausePlayer : startPlayer;
    const leadSeconds = isPauseNext
      ? PAUSE_CUE_LEAD_SECONDS
      : START_CUE_LEAD_SECONDS;
    const startedCue = startedCueRef.current;

    if (!isActive || !isCountdownInCueWindow(countdown, leadSeconds)) {
      startedCue?.player.pause();
      startedCueRef.current = undefined;
      return;
    }

    if (isCueStartedForExercise(startedCue, exerciseId, player)) return;

    startedCue?.player.pause();
    playCueFromRemainingSeconds(player, countdown);
    startedCueRef.current = { exerciseId, player };
  }, [countdown, exerciseId, isActive, isPauseNext, pausePlayer, startPlayer]);
};

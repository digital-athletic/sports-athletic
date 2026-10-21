import { type MutableRefObject, useEffect, useRef, useState } from "react";

type CountdownArgs = {
  autoAdvance: boolean;
  duration: number | undefined;
  exerciseId: string;
  isActive: boolean;
  onEvent?: (event: "advance" | "complete") => void;
  timeoutMs?: number;
};

const unitsLeft = (endsAt: number, timeoutMs: number) =>
  Math.max(0, Math.ceil((endsAt - Date.now()) / timeoutMs));

type StartTimerArgs = {
  duration: number;
  timeoutMs: number;
  autoAdvance: boolean;
  onEvent?: (event: "advance" | "complete") => void;
  endsAtRef: MutableRefObject<number | undefined>;
  pausedAtRef: MutableRefObject<number | undefined>;
  intervalRef: MutableRefObject<ReturnType<typeof setInterval> | undefined>;
  setCountdown: (value: number | undefined) => void;
};

// Advances the deadline (accounting for any pause), then starts ticking.
const startCountdownTimer = ({
  duration,
  timeoutMs,
  autoAdvance,
  onEvent,
  endsAtRef,
  pausedAtRef,
  intervalRef,
  setCountdown,
}: StartTimerArgs) => {
  if (endsAtRef.current === undefined) {
    endsAtRef.current = Date.now() + duration * timeoutMs;
  } else if (pausedAtRef.current !== undefined) {
    endsAtRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = undefined;
  }

  const endsAt = endsAtRef.current;

  const tick = () => {
    const remaining = unitsLeft(endsAt, timeoutMs);
    setCountdown(remaining);

    if (remaining === 0) {
      onEvent?.("complete");
      if (autoAdvance) onEvent?.("advance");
      clearInterval(intervalRef.current);
      setCountdown(undefined);
    }
  };

  tick();
  intervalRef.current = setInterval(tick, timeoutMs);
};

/**
 * Counts down to a deadline. The remaining value comes from the clock, not from
 * the number of ticks, so time that passed without a tick still counts. Pausing
 * shifts the deadline by the pause duration.
 */
export const useCountdown = ({
  autoAdvance,
  duration,
  exerciseId,
  isActive,
  onEvent,
  // Default to 1 second
  timeoutMs = 1000,
}: CountdownArgs) => {
  const [countdown, setCountdown] = useState<number | undefined>(duration);

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const endsAtRef = useRef<number | undefined>(undefined);
  const pausedAtRef = useRef<number | undefined>(undefined);

  // Reset the countdown whenever a new exercise/duration comes in.
  const [prevReset, setPrevReset] = useState({ duration, exerciseId });
  if (
    typeof duration === "number" &&
    (prevReset.duration !== duration || prevReset.exerciseId !== exerciseId)
  ) {
    setPrevReset({ duration, exerciseId });
    setCountdown(duration);
  }

  // Declared before the timer effect below, so a new exercise clears the old
  // deadline before it is read.
  useEffect(() => {
    if (typeof duration !== "number") return;
    endsAtRef.current = undefined;
    pausedAtRef.current = undefined;
  }, [duration, exerciseId]);

  useEffect(() => {
    if (!isActive || typeof duration !== "number") {
      if (endsAtRef.current !== undefined) pausedAtRef.current = Date.now();
      return;
    }

    startCountdownTimer({
      duration,
      timeoutMs,
      autoAdvance,
      onEvent,
      endsAtRef,
      pausedAtRef,
      intervalRef,
      setCountdown,
    });
    const interval = intervalRef.current;

    return () => clearInterval(interval);
  }, [duration, exerciseId, isActive, timeoutMs, autoAdvance, onEvent]);

  return countdown;
};

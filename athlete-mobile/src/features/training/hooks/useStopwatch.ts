import { type MutableRefObject, useEffect, useRef, useState } from "react";

type StopwatchArgs = {
  exerciseId: string;
  isActive: boolean;
  timeoutMs?: number;
};

const elapsedUnits = (startedAt: number, timeoutMs: number) =>
  Math.max(0, Math.floor((Date.now() - startedAt) / timeoutMs));

type StartTimerArgs = {
  timeoutMs: number;
  startedAtRef: MutableRefObject<number | undefined>;
  pausedAtRef: MutableRefObject<number | undefined>;
  intervalRef: MutableRefObject<ReturnType<typeof setInterval> | undefined>;
  setElapsed: (value: number) => void;
};

// Advances the start time (accounting for any pause), then starts ticking.
const startStopwatchTimer = ({
  timeoutMs,
  startedAtRef,
  pausedAtRef,
  intervalRef,
  setElapsed,
}: StartTimerArgs) => {
  if (startedAtRef.current === undefined) {
    startedAtRef.current = Date.now();
  } else if (pausedAtRef.current !== undefined) {
    startedAtRef.current += Date.now() - pausedAtRef.current;
    pausedAtRef.current = undefined;
  }

  const startedAt = startedAtRef.current;

  const tick = () => {
    setElapsed(elapsedUnits(startedAt, timeoutMs));
  };

  tick();
  intervalRef.current = setInterval(tick, timeoutMs);
};

/**
 * Counts up from zero, mirroring useCountdown's deadline-based approach (the
 * elapsed value comes from the clock, not from the number of ticks), but
 * never stops on its own.
 */
export const useStopwatch = ({
  exerciseId,
  isActive,
  // Default to 1 second
  timeoutMs = 1000,
}: StopwatchArgs) => {
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startedAtRef = useRef<number | undefined>(undefined);
  const pausedAtRef = useRef<number | undefined>(undefined);

  // Reset the stopwatch whenever a new exercise comes in.
  const [prevExerciseId, setPrevExerciseId] = useState(exerciseId);
  if (prevExerciseId !== exerciseId) {
    setPrevExerciseId(exerciseId);
    setElapsed(0);
  }

  // Declared before the timer effect below, so a new exercise clears the old
  // start time before it is read.
  useEffect(() => {
    startedAtRef.current = undefined;
    pausedAtRef.current = undefined;
  }, [exerciseId]);

  useEffect(() => {
    if (!isActive) {
      if (startedAtRef.current !== undefined) {
        pausedAtRef.current = Date.now();
      }
      return;
    }

    startStopwatchTimer({
      timeoutMs,
      startedAtRef,
      pausedAtRef,
      intervalRef,
      setElapsed,
    });
    const interval = intervalRef.current;

    return () => clearInterval(interval);
  }, [exerciseId, isActive, timeoutMs]);

  return elapsed;
};

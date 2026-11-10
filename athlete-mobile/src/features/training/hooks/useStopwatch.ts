import { type MutableRefObject, useEffect, useRef, useState } from "react";

type StopwatchArgs = {
  exerciseId: string;
  isActive: boolean;
  /** Running time the stopwatch starts from, e.g. a resumed set. */
  initialElapsedMs?: number;
  /** Receives the running time, pauses excluded, each time the stopwatch stops or unmounts while running. */
  onStop?: (elapsedMs: number) => void;
  timeoutMs?: number;
};

const elapsedUnits = (startedAt: number, timeoutMs: number) =>
  Math.max(0, Math.floor((Date.now() - startedAt) / timeoutMs));

type StartTimerArgs = {
  timeoutMs: number;
  initialElapsedMs: number;
  startedAtRef: MutableRefObject<number | undefined>;
  pausedAtRef: MutableRefObject<number | undefined>;
  intervalRef: MutableRefObject<ReturnType<typeof setInterval> | undefined>;
  setElapsed: (value: number) => void;
};

// Advances the start time (accounting for any pause), then starts ticking.
const startStopwatchTimer = ({
  timeoutMs,
  initialElapsedMs,
  startedAtRef,
  pausedAtRef,
  intervalRef,
  setElapsed,
}: StartTimerArgs) => {
  if (startedAtRef.current === undefined) {
    startedAtRef.current = Date.now() - initialElapsedMs;
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

type StopRefs = {
  startedAtRef: MutableRefObject<number | undefined>;
  pausedAtRef: MutableRefObject<number | undefined>;
  onStopRef: MutableRefObject<((elapsedMs: number) => void) | undefined>;
};

// Marks the stop time and reports the running time, once per stop.
const recordStop = ({ startedAtRef, pausedAtRef, onStopRef }: StopRefs) => {
  if (startedAtRef.current === undefined) return;
  if (pausedAtRef.current !== undefined) return;
  pausedAtRef.current = Date.now();
  onStopRef.current?.(pausedAtRef.current - startedAtRef.current);
};

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

/**
 * Counts up from zero, mirroring useCountdown's deadline-based approach (the
 * elapsed value comes from the clock, not from the number of ticks), but
 * never stops on its own.
 */
export const useStopwatch = ({
  exerciseId,
  isActive,
  initialElapsedMs = 0,
  onStop,
  // Default to 1 second
  timeoutMs = 1000,
}: StopwatchArgs) => {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor(initialElapsedMs / timeoutMs),
  );
  // Kept in refs so a new callback identity does not restart the timer.
  const initialElapsedMsRef = useRef(initialElapsedMs);
  const onStopRef = useLatestRef(onStop);

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
      recordStop({ startedAtRef, pausedAtRef, onStopRef });
      return;
    }

    startStopwatchTimer({
      timeoutMs,
      initialElapsedMs: initialElapsedMsRef.current,
      startedAtRef,
      pausedAtRef,
      intervalRef,
      setElapsed,
    });
    // The offset belongs to the first exercise only.
    initialElapsedMsRef.current = 0;
    const interval = intervalRef.current;

    return () => clearInterval(interval);
  }, [exerciseId, isActive, timeoutMs, onStopRef]);

  // A native sheet can unmount its content in the same render that closes it,
  // so the stop branch above never runs.
  useEffect(() => {
    const stopRefs = { startedAtRef, pausedAtRef, onStopRef };
    return () => recordStop(stopRefs);
  }, [onStopRef]);

  return elapsed;
};

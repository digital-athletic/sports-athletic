import { useEffect, useRef, useState } from "react";

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

  // Declared before the timer below, so a new exercise clears the old deadline
  // before it is read.
  useEffect(() => {
    if (typeof duration !== "number") return;
    setCountdown(duration);
    endsAtRef.current = undefined;
    pausedAtRef.current = undefined;
  }, [duration, exerciseId]);

  useEffect(() => {
    if (!isActive || typeof duration !== "number") {
      if (endsAtRef.current !== undefined) pausedAtRef.current = Date.now();
      return;
    }

    if (endsAtRef.current === undefined) {
      endsAtRef.current = Date.now() + duration * timeoutMs;
    } else if (pausedAtRef.current !== undefined) {
      endsAtRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = undefined;
    }

    const endsAt = endsAtRef.current;
    setCountdown(unitsLeft(endsAt, timeoutMs));

    intervalRef.current = setInterval(
      () => setCountdown(unitsLeft(endsAt, timeoutMs)),
      timeoutMs,
    );

    return () => clearInterval(intervalRef.current);
  }, [duration, exerciseId, isActive, timeoutMs]);

  useEffect(() => {
    if (countdown === 0) {
      onEvent?.("complete");

      if (autoAdvance) {
        onEvent?.("advance");
      }

      clearInterval(intervalRef.current);
      setCountdown(undefined);
    }
  }, [autoAdvance, countdown, onEvent]);

  return countdown;
};

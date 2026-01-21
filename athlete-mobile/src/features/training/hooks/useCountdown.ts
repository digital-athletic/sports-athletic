import { useCallback, useEffect, useRef, useState } from "react";

type CountdownArgs = {
  exerciseId: string;
  autoAdvance: boolean;
  duration: number | undefined;
  isActive: boolean;
  onAutoAdvance?: () => void;
  onComplete?: () => void;
  timeoutMs?: number;
};

export const useCountdown = ({
  autoAdvance,
  duration,
  exerciseId,
  isActive,
  onAutoAdvance,
  onComplete,
  // Default to 1 second
  timeoutMs = 1000,
}: CountdownArgs) => {
  const [countdown, setCountdown] = useState<number | undefined>(duration);

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const tick = useCallback(() => {
    setCountdown((previous) =>
      Math.max(
        0,
        typeof previous === "number" ? previous - 1 : (duration ?? 0),
      ),
    );
  }, [duration]);

  useEffect(() => {
    if (!isActive || typeof duration !== "number") {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(tick, timeoutMs);

    return () => clearInterval(intervalRef.current);
  }, [duration, isActive, tick, timeoutMs]);

  useEffect(() => {
    if (countdown === 0) {
      onComplete?.();

      if (autoAdvance) {
        onAutoAdvance?.();
      }

      clearInterval(intervalRef.current);
      setCountdown(undefined);
    }
  }, [autoAdvance, countdown, onAutoAdvance, onComplete]);

  useEffect(() => {
    // Reset countdown when duration or exerciseId changes
    if (typeof duration === "number") {
      setCountdown(duration);
    }
  }, [duration, exerciseId]);

  return countdown;
};

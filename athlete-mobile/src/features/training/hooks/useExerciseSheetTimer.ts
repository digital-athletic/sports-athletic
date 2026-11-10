import { useStopwatch } from "./useStopwatch";

type Args = {
  exerciseId: string;
  duration: number | undefined;
  isActive: boolean;
  initialElapsedMs?: number;
  onStop?: (elapsedMs: number) => void;
};

/**
 * Timer for the exercise sheet. A timed exercise shows the time left of its
 * duration, an open-ended one the time elapsed.
 */
export function useExerciseSheetTimer({
  exerciseId,
  duration,
  isActive,
  initialElapsedMs,
  onStop,
}: Args) {
  const elapsed = useStopwatch({
    exerciseId,
    isActive,
    initialElapsedMs,
    onStop,
  });

  return sheetTimerDisplay(duration, elapsed);
}

/** What the sheet timer shows after `elapsed` seconds of running time. */
export const sheetTimerDisplay = (
  duration: number | undefined,
  elapsed: number,
) => {
  if (typeof duration !== "number") {
    return { displayedSeconds: elapsed, isCountingDown: false };
  }

  const remaining = Math.max(0, duration - elapsed);
  return { displayedSeconds: remaining, isCountingDown: remaining > 0 };
};

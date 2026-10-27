import { useStopwatch } from "./useStopwatch";

type Args = {
  exerciseId: string;
  duration: number | undefined;
  isActive: boolean;
};

/**
 * Timer for the exercise sheet. A timed exercise shows the time left of its
 * duration, an open-ended one the time elapsed.
 */
export function useExerciseSheetTimer({
  exerciseId,
  duration,
  isActive,
}: Args) {
  const elapsed = useStopwatch({ exerciseId, isActive });

  if (typeof duration !== "number") {
    return { displayedSeconds: elapsed, isCountingDown: false };
  }

  const remaining = Math.max(0, duration - elapsed);
  return { displayedSeconds: remaining, isCountingDown: remaining > 0 };
}

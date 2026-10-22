import { useCountdown } from "./useCountdown";
import { useStopwatch } from "./useStopwatch";

type Args = {
  exerciseId: string;
  duration: number | undefined;
  isScreenFocused: boolean;
};

/**
 * Timer for the exercise sheet: counts down to zero for a timed exercise, or
 * up from zero otherwise. Only the relevant one of the two actually ticks.
 */
export function useExerciseSheetTimer({
  exerciseId,
  duration,
  isScreenFocused,
}: Args) {
  const hasDuration = typeof duration === "number";

  const countdown = useCountdown({
    exerciseId,
    duration,
    isActive: hasDuration && isScreenFocused,
    autoAdvance: false,
  });
  const elapsed = useStopwatch({
    exerciseId,
    isActive: !hasDuration && isScreenFocused,
  });

  const displayedSeconds = hasDuration ? (countdown ?? 0) : elapsed;
  const isCountingDown =
    hasDuration && typeof countdown === "number" && countdown > 0;

  return { displayedSeconds, isCountingDown };
}

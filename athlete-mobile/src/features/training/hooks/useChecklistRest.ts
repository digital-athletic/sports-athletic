import { type TrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { useRef } from "react";

type Args = {
  timing: Pick<TrainingListTiming, "endExercise">;
  onRestEnd: (restIndex: number, skipped: boolean) => void;
};

/**
 * Records the outcome of the rest the checklist sheet runs after a set, once,
 * on that rest entry: the countdown runs out, the athlete skips, or the
 * athlete swipes the sheet away.
 */
export function useChecklistRest({ timing, onRestEnd }: Args) {
  const runningRestRef = useRef<number | null>(null);

  // Exercise time stops when the rest starts.
  const startRest = (restIndex: number) => {
    runningRestRef.current = restIndex;
    timing.endExercise();
  };

  const endRest = (skipped: boolean) => {
    const restIndex = runningRestRef.current;
    if (restIndex === null) return;
    runningRestRef.current = null;
    onRestEnd(restIndex, skipped);
  };

  return { startRest, endRest };
}

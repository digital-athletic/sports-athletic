import { useTrainingExerciseSheetProps } from "@/features/training/hooks/useTrainingExerciseSheetProps";
import { useTrainingListCompletion } from "@/features/training/hooks/useTrainingListCompletion";
import { useTrainingListFinish } from "@/features/training/hooks/useTrainingListFinish";
import { useTrainingListLifecycle } from "@/features/training/hooks/useTrainingListLifecycle";
import { useTrainingListReps } from "@/features/training/hooks/useTrainingListReps";
import { useTrainingListRows } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useRouter } from "expo-router";

/**
 * Composes the list-view (checklist) screen's logic from its focused
 * sub-hooks: entries per exercise, per-set completion, reps drafts, the
 * exercise sheet, and screen lifecycle.
 */
export function useTrainingListScreen() {
  const router = useRouter();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const hasHydrated = useTrainingStore((s) => s._hasHydrated);

  const { rows, blocks, allCompleted, progress } = useTrainingListRows();
  const completion = useTrainingListCompletion();
  const { repsDraft, setRepsForRow, handleSubmitReps } = useTrainingListReps();
  const timing = useTrainingListTiming();
  const { isFinishing, handleFinish } = useTrainingListFinish({
    allCompleted,
    endPause: timing.endPause,
    completeRestRows: completion.completeRestRows,
  });
  const { handleDiscard, isScreenFocused } = useTrainingListLifecycle({
    isEnding: isFinishing,
  });
  const { handleStart, sheetProps, resumeSecondsOf } =
    useTrainingExerciseSheetProps({
      rows,
      exerciseList,
      repsDraft,
      timing,
      onChangeReps: setRepsForRow,
      onSubmitReps: handleSubmitReps,
      onComplete: completion.handleComplete,
      onRestEnd: completion.handleRestEnd,
      onSkip: completion.handleSkip,
    });

  const handleShowInfo = (exerciseId: string) => {
    router.push({
      pathname: "/training/exercise-information",
      params: { exerciseId },
    });
  };

  return {
    hasHydrated,
    exerciseList,
    repsDraft,
    blocks,
    progress,
    isFinishing,
    handleFinish,
    handleShowInfo,
    handleStart,
    handleDiscard,
    resumeSecondsOf,
    sheetProps: { ...sheetProps, isScreenFocused },
  };
}

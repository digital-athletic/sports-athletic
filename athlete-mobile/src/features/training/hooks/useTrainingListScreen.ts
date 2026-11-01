import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { useTrainingExerciseSheetProps } from "@/features/training/hooks/useTrainingExerciseSheetProps";
import { useTrainingListCompletion } from "@/features/training/hooks/useTrainingListCompletion";
import { useTrainingListLifecycle } from "@/features/training/hooks/useTrainingListLifecycle";
import { useTrainingListReps } from "@/features/training/hooks/useTrainingListReps";
import { useTrainingListRows } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useRouter } from "expo-router";
import { useState } from "react";

/**
 * Composes the list-view (checklist) screen's logic from its focused
 * sub-hooks: row building, per-row completion, reps drafts, the exercise
 * sheet, and screen lifecycle.
 */
export function useTrainingListScreen() {
  const router = useRouter();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const hasHydrated = useTrainingStore((s) => s._hasHydrated);
  const { finishTraining } = useFinishTraining();

  const { rows, allCompleted } = useTrainingListRows();
  const completion = useTrainingListCompletion();
  const { repsDraft, setRepsForRow, handleSubmitReps } = useTrainingListReps();
  const { handleAbort, isScreenFocused } = useTrainingListLifecycle({
    onFinish: finishTraining,
  });
  const timing = useTrainingListTiming();
  const { handleStart, sheetProps } = useTrainingExerciseSheetProps({
    rows,
    exerciseList,
    repsDraft,
    timing,
    onChangeReps: setRepsForRow,
    onSubmitReps: handleSubmitReps,
    onComplete: completion.handleComplete,
    onRestEnd: completion.handleRestEnd,
  });
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = () => {
    // Visible feedback only — useFinishTraining itself guards against
    // duplicate invocations, this just disables the button after the first tap.
    setIsFinishing(true);
    timing.endPause();
    completion.completeRestRows();
    finishTraining(false, useTrainingStore.getState().tempMaxValues);
  };

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
    rows,
    allCompleted,
    isFinishing,
    handleFinish,
    handleSkip: completion.handleSkip,
    handleShowInfo,
    handleStart,
    handleAbort,
    sheetProps: { ...sheetProps, isScreenFocused },
  };
}

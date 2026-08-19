import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { useTrainingListCompletion } from "@/features/training/hooks/useTrainingListCompletion";
import { useTrainingListLifecycle } from "@/features/training/hooks/useTrainingListLifecycle";
import { useTrainingListReps } from "@/features/training/hooks/useTrainingListReps";
import { useTrainingListRows } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useRouter } from "expo-router";
import { useState } from "react";

/**
 * Composes the list-view (checklist) screen's logic from its focused
 * sub-hooks: row building, per-row completion, reps drafts, and screen
 * lifecycle.
 */
export function useTrainingListScreen() {
  const router = useRouter();
  const exerciseList = useTrainingStore((s) => s.exerciseList);
  const hasHydrated = useTrainingStore((s) => s._hasHydrated);
  const tempMaxValues = useTrainingStore((s) => s.tempMaxValues);
  const { finishTraining } = useFinishTraining();

  const { rows } = useTrainingListRows();
  const { handleComplete, handleSkip } = useTrainingListCompletion();
  const { repsDraft, setRepsForRow, handleSubmitReps } = useTrainingListReps();
  const { handleAbort } = useTrainingListLifecycle({
    onFinish: finishTraining,
  });
  const [isFinishing, setIsFinishing] = useState(false);

  // All visible rows completed -> enable the finish button, mirroring the
  // last exercise in the sequential flow, but requiring an explicit tap
  // instead of auto-navigating.
  const allCompleted = rows.length > 0 && rows.every((row) => row.completed);

  const handleFinish = () => {
    // Visible feedback only — useFinishTraining itself guards against
    // duplicate invocations, this just disables the button after the first tap.
    setIsFinishing(true);
    finishTraining(false, tempMaxValues);
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
    handleComplete,
    handleSkip,
    handleSubmitReps,
    setRepsForRow,
    handleShowInfo,
    handleAbort,
  };
}

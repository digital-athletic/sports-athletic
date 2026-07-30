import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { useTrainingListCompletion } from "@/features/training/hooks/useTrainingListCompletion";
import { useTrainingListLifecycle } from "@/features/training/hooks/useTrainingListLifecycle";
import { useTrainingListReps } from "@/features/training/hooks/useTrainingListReps";
import { useTrainingListRows } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getIncompleteCount } from "@/features/training/utils/listCompletionUtils";
import { useRouter } from "expo-router";

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
  const { completedExerciseIndices, handleComplete, handleSkip } =
    useTrainingListCompletion();
  const { repsDraft, setRepsForRow, handleSubmitReps } = useTrainingListReps();
  const { handleAbort } = useTrainingListLifecycle({
    onFinish: finishTraining,
  });

  // All visible rows completed -> enable the finish button, mirroring the
  // last exercise in the sequential flow, but requiring an explicit tap
  // instead of auto-navigating.
  const allCompleted =
    rows.length > 0 &&
    getIncompleteCount(
      rows.map((row) => row.index),
      completedExerciseIndices,
    ) === 0;

  const handleFinish = () => {
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
    completedExerciseIndices,
    repsDraft,
    rows,
    allCompleted,
    handleFinish,
    handleComplete,
    handleSkip,
    handleSubmitReps,
    setRepsForRow,
    handleShowInfo,
    handleAbort,
  };
}

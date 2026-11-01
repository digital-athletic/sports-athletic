import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";

// Reads the store, not the render closure, so a second call before re-render sees the row as completed.
export const isRowCompleted = (index: number) =>
  useTrainingStore.getState().exerciseList?.[index]?.completed === true;

/**
 * Complete/skip handlers for a checklist row, guarding against
 * double-applying progression for an already-completed row. A skipped row
 * runs no progression.
 */
export function useTrainingListCompletion() {
  const markExerciseCompleted = useTrainingStore(
    (s) => s.markExerciseCompleted,
  );
  const { saveExerciseAndBranchData, handleFeedback, handleExerciseSkipped } =
    useExerciseCompletion();

  const handleComplete = (row: ListRow, feedback?: DifficultyFeedbackType) => {
    if (isRowCompleted(row.index)) return;

    if (feedback && row.isLastInSet && !row.isTest) {
      handleFeedback(row.index, feedback);
    }
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  const handleSkip = (row: ListRow) => {
    if (isRowCompleted(row.index)) return;

    handleExerciseSkipped(row.index);
    markExerciseCompleted(row.index);
  };

  // The checklist has no rest timer, so rest rows count as completed.
  const completeRestRows = () => {
    useTrainingStore.getState().exerciseList?.forEach((exercise, index) => {
      if (isPauseExercise(exercise.exerciseId)) markExerciseCompleted(index);
    });
  };

  return { handleComplete, handleSkip, completeRestRows };
}

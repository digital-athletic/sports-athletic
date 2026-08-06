import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { useTrainingStore } from "@/features/training/trainingStore";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";

/**
 * Complete/skip handlers for a checklist row, guarding against
 * double-applying progression for an already-completed row.
 */
export function useTrainingListCompletion() {
  const completedExerciseIndices = useTrainingStore(
    (s) => s.completedExerciseIndices,
  );
  const markExerciseCompleted = useTrainingStore(
    (s) => s.markExerciseCompleted,
  );
  const { saveExerciseAndBranchData, handleFeedback, handleExerciseSkipped } =
    useExerciseCompletion();

  const handleComplete = (row: ListRow, feedback?: DifficultyFeedbackType) => {
    if (completedExerciseIndices.includes(row.index)) return;

    if (row.isLastInSet && !row.isTest) {
      handleFeedback(row.index, feedback ?? "SUCCEEDED");
    }
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  const handleSkip = (row: ListRow) => {
    if (completedExerciseIndices.includes(row.index)) return;

    handleExerciseSkipped(row.index);
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  return { completedExerciseIndices, handleComplete, handleSkip };
}

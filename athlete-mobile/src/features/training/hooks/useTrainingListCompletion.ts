import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import {
  isPauseExercise,
  PAUSE_EXERCISE_ID,
} from "@/features/training/models/IdTypes";
import { Logger } from "@/services/Logger";
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
  const markExerciseSkipped = useTrainingStore((s) => s.markExerciseSkipped);
  const { saveExerciseAndBranchData, handleFeedback } = useExerciseCompletion();

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

    // Sets share exerciseId and skill, so only the index marks the skipped set.
    markExerciseSkipped(row.index);
    Logger.logEvent("exercise_skipped", { exerciseId: row.exerciseId });
    markExerciseCompleted(row.index);
  };

  // Rests the athlete never started, e.g. after a skipped set, count as completed.
  const completeRestRows = () => {
    useTrainingStore.getState().exerciseList?.forEach((exercise, index) => {
      if (isPauseExercise(exercise.exerciseId)) markExerciseCompleted(index);
    });
  };

  const handleRestEnd = (restIndex: number, skipped: boolean) => {
    if (isRowCompleted(restIndex)) return;

    if (skipped) {
      markExerciseSkipped(restIndex);
      Logger.logEvent("exercise_skipped", { exerciseId: PAUSE_EXERCISE_ID });
    }
    markExerciseCompleted(restIndex);
  };

  return { handleComplete, handleSkip, handleRestEnd, completeRestRows };
}

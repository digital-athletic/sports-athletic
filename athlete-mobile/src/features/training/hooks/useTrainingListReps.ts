import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { isRowCompleted } from "@/features/training/hooks/useTrainingListCompletion";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useState } from "react";

/**
 * Reps-draft state for strength-test rows in the checklist, plus the submit
 * handler that persists the drafted value and marks the row complete.
 */
export function useTrainingListReps() {
  const markExerciseCompleted = useTrainingStore(
    (s) => s.markExerciseCompleted,
  );
  const { saveExerciseAndBranchData, saveRepsInput } = useExerciseCompletion();
  const [repsDraft, setRepsDraft] = useState<Record<number, number>>({});

  const setRepsForRow = (index: number, value: string) => {
    const num = Number.parseInt(value) || 0;
    setRepsDraft((prev) => ({ ...prev, [index]: num }));
  };

  const handleSubmitReps = (row: ListRow) => {
    if (isRowCompleted(row.index)) return;

    saveRepsInput(row.index, repsDraft[row.index] ?? 0);
    saveExerciseAndBranchData(row.index);
    markExerciseCompleted(row.index);
  };

  return { repsDraft, setRepsForRow, handleSubmitReps };
}

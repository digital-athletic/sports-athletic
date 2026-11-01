import {
  type ChecklistEntry,
  type ListRow,
} from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListSheet } from "@/features/training/hooks/useTrainingListSheet";
import { type TrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import { findFirstOpenSetIndex } from "@/features/training/utils/checklistEntries";

type Args = {
  rows: ListRow[];
  exerciseList: UserExerciseDataType[] | null;
  timing: Pick<TrainingListTiming, "startExercise" | "endExercise">;
};

/**
 * Moves the checklist sheet between sets: Start opens an entry's first open
 * set, Next opens the first open set of the workout, as the step-by-step view
 * does, and closes the sheet after the last one. Each move restarts the
 * exercise timing.
 */
export function useTrainingListSetNavigation({
  rows,
  exerciseList,
  timing,
}: Args) {
  const sheet = useTrainingListSheet(rows);
  const { activeRow, openSheet, closeSheet } = sheet;

  const handleStart = (entry: ChecklistEntry) => {
    if (entry.firstOpenSetIndex === null) return;
    timing.startExercise(exerciseList?.[entry.firstOpenSetIndex]?.skill);
    openSheet(entry.firstOpenSetIndex);
  };

  const handleDismiss = () => {
    timing.endExercise();
    closeSheet();
  };

  // Reads the store: the set completed in this same render is not in the
  // render's exerciseList yet.
  const handleNext = () => {
    if (!activeRow) return;
    const latestList = useTrainingStore.getState().exerciseList ?? [];
    const nextIndex = findFirstOpenSetIndex(latestList);
    if (nextIndex === null) {
      handleDismiss();
      return;
    }
    timing.endExercise();
    timing.startExercise(latestList[nextIndex]?.skill);
    openSheet(nextIndex);
  };

  return { ...sheet, handleStart, handleNext, handleDismiss };
}

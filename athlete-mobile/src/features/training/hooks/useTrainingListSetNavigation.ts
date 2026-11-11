import {
  type ChecklistEntry,
  type ListRow,
} from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListSheet } from "@/features/training/hooks/useTrainingListSheet";
import { type TrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { useTrainingStore } from "@/features/training/trainingStore";
import { findNextOpenSetIndex } from "@/features/training/utils/checklistEntries";
import { useState } from "react";

/** A set that ran shorter than this starts over when reopened. */
export const RESUME_MIN_RUN_MS = 10_000;

type Args = {
  rows: ListRow[];
  exerciseList: UserExerciseDataType[] | null;
  timing: Pick<TrainingListTiming, "startExercise" | "endExercise">;
};

/** Running time per set index, kept so a reopened set can continue. */
function useSavedSetTimes() {
  const [savedRunMs, setSavedRunMs] = useState<Record<number, number>>({});

  const saveSetTime = (index: number, elapsedMs: number) =>
    setSavedRunMs((prev) => ({ ...prev, [index]: elapsedMs }));

  const resumeRunMsOf = (index: number) => {
    const runMs = savedRunMs[index] ?? 0;
    return runMs >= RESUME_MIN_RUN_MS ? runMs : 0;
  };

  return { saveSetTime, resumeRunMsOf };
}

/**
 * Moves the checklist sheet between sets: Start opens an entry's first open
 * set, Next opens the next open set below it, and reaching the end closes the
 * sheet even if earlier sets remain open. Each move restarts exercise timing.
 * A set reopened after RESUME_MIN_RUN_MS of running time continues from it.
 */
export function useTrainingListSetNavigation({
  rows,
  exerciseList,
  timing,
}: Args) {
  const sheet = useTrainingListSheet(rows);
  const { activeRow, openSheet, closeSheet } = sheet;
  const { saveSetTime, resumeRunMsOf } = useSavedSetTimes();

  const handleStart = (entry: ChecklistEntry) => {
    if (entry.firstOpenSetIndex === null) return;
    timing.startExercise(exerciseList?.[entry.firstOpenSetIndex]?.skill);
    openSheet(entry.firstOpenSetIndex, resumeRunMsOf(entry.firstOpenSetIndex));
  };

  // entry.firstOpenSetIndex predates the reopen, so the skipped sets give the index.
  const handleRetake = (entry: ChecklistEntry) => {
    const skippedIndices = entry.sets
      .filter((set) => set.skipped)
      .map((set) => set.index);
    const firstIndex = skippedIndices[0];
    if (firstIndex === undefined) return;

    useTrainingStore.getState().reopenSkippedSets(skippedIndices);
    timing.startExercise(exerciseList?.[firstIndex]?.skill);
    openSheet(firstIndex);
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
    const nextIndex = findNextOpenSetIndex(latestList, activeRow.index);
    if (nextIndex === null) {
      handleDismiss();
      return;
    }
    timing.endExercise();
    timing.startExercise(latestList[nextIndex]?.skill);
    openSheet(nextIndex, resumeRunMsOf(nextIndex));
  };

  return {
    ...sheet,
    handleStart,
    handleRetake,
    handleNext,
    handleDismiss,
    saveSetTime,
    resumeRunMsOf,
  };
}

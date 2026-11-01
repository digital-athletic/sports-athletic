import { isPauseExercise } from "@/features/training/models/IdTypes";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";

type PlannedRest = { index: number; duration: number };

/** What the rest screen shows: the rest length. */
export type SheetRest = {
  duration: number;
};

/** The rest after the sheet's set, with the callbacks that record it. */
export type SheetRestControl = {
  plan: SheetRest;
  onStart: () => void;
  onEnd: (skipped: boolean) => void;
};

/** The open rest the set list plans right after the set at `setIndex`, if any. */
export const findRestAfter = (
  exerciseList: readonly UserExerciseDataType[] | null,
  setIndex: number,
): PlannedRest | null => {
  const index = setIndex + 1;
  const entry = exerciseList?.[index];
  if (!entry || !isPauseExercise(entry.exerciseId) || entry.completed) {
    return null;
  }
  const duration = entry.duration ?? 0;
  return duration > 0 ? { index, duration } : null;
};

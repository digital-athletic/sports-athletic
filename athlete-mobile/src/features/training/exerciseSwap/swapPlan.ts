import type { ExerciseBranchType } from "../models/ExerciseBranch";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";

export interface ExerciseSwapState {
  skill: string;
  /** 0 is the original branch, 1 to n the alternatives. */
  position: number;
  alternatives: readonly StoredBranch[];
}

/** Writes a catalog branch in the form the training plan stores. */
export const toExerciseBranch = ({
  branchId,
  branch,
}: StoredBranch): ExerciseBranchType => ({
  branchId,
  tags: branch.tags ?? [],
  exercises: Object.fromEntries(
    Object.entries(branch.levels ?? branch.exercises ?? {}).flatMap(
      ([level, { exerciseId }]) =>
        exerciseId ? [[Number(level), { exerciseId }]] : [],
    ),
  ),
});

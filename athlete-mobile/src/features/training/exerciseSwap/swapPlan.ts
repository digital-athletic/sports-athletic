import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import {
  getRaisedSubstituteLevel,
  type SubstituteLevel,
} from "../utils/substitutionLevelUtils";
import type { ExerciseBranchType } from "../models/ExerciseBranch";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";

export interface ExerciseSwapState {
  skill: string;
  /** 0 is the original branch, 1 to n the alternatives. */
  position: number;
  alternatives: readonly StoredBranch[];
  /** The session entries of the original branch, restored at position 0. */
  originalEntries: readonly UserExerciseDataType[];
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

/** The alternatives the exercises show; an original branch adds none. */
export const listSwappedInBranches = (
  swaps: readonly ExerciseSwapState[],
): StoredBranch[] =>
  swaps.flatMap(({ position, alternatives }) =>
    position === 0 ? [] : [alternatives[position - 1]],
  );

/**
 * The start levels of swapped in branches: a stored level below the entry
 * level rises to it. A branch without a raised level adds none.
 */
export const listSwapStartLevels = (
  branches: readonly StoredBranch[],
  branchData: BranchDataMapType,
  fitnessLevel: string,
): SubstituteLevel[] =>
  branches.flatMap(
    (branch) =>
      getRaisedSubstituteLevel(
        toExerciseBranch(branch),
        branchData,
        fitnessLevel,
      ) ?? [],
  );

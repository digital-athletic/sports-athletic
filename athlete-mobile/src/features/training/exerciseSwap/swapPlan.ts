import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import {
  getRaisedSubstituteLevel,
  type SubstituteLevel,
} from "../utils/substitutionLevelUtils";
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

/**
 * The levels to store for the swapped in branches when the training starts:
 * a stored level below the entry level rises to it, so feedback starts from
 * the level the athlete trains. Original branches keep their level.
 */
export const listSwapStartLevels = (
  swaps: Readonly<Record<string, ExerciseSwapState>>,
  branchData: BranchDataMapType,
  fitnessLevel: string,
): SubstituteLevel[] =>
  Object.values(swaps).flatMap(({ position, alternatives }) =>
    position === 0
      ? []
      : (getRaisedSubstituteLevel(
          toExerciseBranch(alternatives[position - 1]),
          branchData,
          fitnessLevel,
        ) ?? []),
  );

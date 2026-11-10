import { getSectionForDate } from "../trainingUtils";
import type { ExerciseBranchType } from "../models/ExerciseBranch";
import type { TrainingPlanType } from "../models/TrainingPlan";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";

export interface ExerciseSwapState {
  skill: string;
  /** 0 is the original branch, 1 to n the alternatives. */
  position: number;
  alternatives: readonly StoredBranch[];
}

export interface PlanSwap {
  skill: string;
  originalBranchId: string;
  branch: ExerciseBranchType;
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

/** The plan rewrites for every exercise not cycled back to its original. */
export const collectPlanSwaps = (
  swaps: Readonly<Record<string, ExerciseSwapState>>,
): PlanSwap[] =>
  Object.entries(swaps).flatMap(([originalBranchId, swap]) =>
    swap.position === 0
      ? []
      : [
          {
            skill: swap.skill,
            originalBranchId,
            branch: toExerciseBranch(swap.alternatives[swap.position - 1]),
          },
        ],
  );

/**
 * The plan section a training reads: the given one, else the section of
 * today. A given section 0 reads as none, as in workout generation.
 */
export const resolvePlanSectionIndex = (
  plan: TrainingPlanType,
  givenSection: number | undefined,
  today: Date,
): number =>
  givenSection
    ? givenSection
    : plan.sections.indexOf(getSectionForDate(plan.sections, today.getTime()));

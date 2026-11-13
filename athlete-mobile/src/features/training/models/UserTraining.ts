import { type FocusType, type SkillTypes } from "@/constants/workoutConstants";
import type { Template } from "@/schemas/aiwl.schema";
import { ExerciseBranchType } from "./ExerciseBranch";

/** The branches a training day copied from the skill trees, per skill. */
export type CopiedBranchesType = {
  [skillKey in SkillTypes]?: ExerciseBranchType[];
};

/** A training day that stores copied branches and minutes per skill. */
export type LegacyTrainingType = {
  weekday: number;
  skills: CopiedBranchesType;
  lengths: {
    [skillKey in SkillTypes]?: number;
  };
  focus: FocusType;
  /** Equipment of the day's place at plan creation; regeneration compares it. */
  equipment?: string[];
};

/** A training day that stores its workout in the AIWL. */
export type AiwlTrainingType = {
  weekday: number;
  workout: Template;
  focus: FocusType;
  /** Equipment of the day's place at plan creation; regeneration compares it. */
  equipment?: string[];
};

export type UserTrainingType = LegacyTrainingType | AiwlTrainingType;

/**
 * True for a training day that stores copied branches and minutes per skill.
 * Only an AIWL training day stores a workout; a legacy day stored before store
 * version 17 can lack `skills`.
 */
export const isLegacyTraining = (
  training: UserTrainingType,
): training is LegacyTrainingType => !("workout" in training);

/**
 * Returns the copied branches of a legacy training day, or none for a legacy day
 * stored without `skills`. A training day stored as an AIWL workout copies no
 * branches and returns undefined.
 */
export const readCopiedBranches = (
  training: UserTrainingType,
): CopiedBranchesType | undefined =>
  isLegacyTraining(training) ? (training.skills ?? {}) : undefined;

/**
 * Returns a copy of the AIWL workout with the replacement IDs in place of the
 * first occurrence of the branch ID in the branches blocks of the skill.
 * Returns undefined when no block of the skill plans the branch ID.
 *
 * replaceBranchIdInWorkout({ blocks: [{ kind: "branches", skill: "SK", branches: ["10", "11"] }] }, "SK", "10", ["20", "21"])
 * → { blocks: [{ kind: "branches", skill: "SK", branches: ["20", "21", "11"] }] }
 */
export const replaceBranchIdInWorkout = (
  workout: Template,
  skill: string,
  branchId: string,
  replacementIds: readonly string[],
): Template | undefined => {
  const blockIndex = workout.blocks.findIndex(
    (block) =>
      block.kind === "branches" &&
      block.skill === skill &&
      block.branches.includes(branchId),
  );
  const block = workout.blocks[blockIndex];
  if (block?.kind !== "branches") return undefined;
  const branches = [...block.branches];
  branches.splice(branches.indexOf(branchId), 1, ...replacementIds);
  return {
    ...workout,
    blocks: workout.blocks.map((other, index) =>
      index === blockIndex ? { ...block, branches } : other,
    ),
  };
};

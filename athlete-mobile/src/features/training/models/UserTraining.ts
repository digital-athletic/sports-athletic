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

/** No generator runs a training day stored as an AIWL workout yet. */
export const AIWL_TRAINING_DAY_ERROR =
  "A training day stored as an AIWL workout has no copied branches";

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

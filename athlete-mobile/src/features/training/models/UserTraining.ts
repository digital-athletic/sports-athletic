import { type FocusType, type SkillTypes } from "@/constants/workoutConstants";
import type { Template } from "@/schemas/aiwl.schema";
import { ExerciseBranchType } from "./ExerciseBranch";

/** The branches a training day copied from the skill trees, per skill. */
export type CopiedBranchesType = {
  [skillKey in SkillTypes]?: ExerciseBranchType[];
};

/** A training day that stores copied branches and minutes per skill. */
export type OldTrainingType = {
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

export type UserTrainingType = OldTrainingType | AiwlTrainingType;

/** No generator runs a training day stored as an AIWL workout yet. */
export const AIWL_TRAINING_DAY_ERROR =
  "A training day stored as an AIWL workout has no copied branches";

/** True for a training day that stores copied branches and minutes per skill. */
export const isOldTraining = (
  training: UserTrainingType,
): training is OldTrainingType => "skills" in training;

/**
 * Returns the copied branches of an old training day. A training day stored
 * as an AIWL workout copies no branches and returns undefined.
 */
export const readCopiedBranches = (
  training: UserTrainingType,
): CopiedBranchesType | undefined =>
  isOldTraining(training) ? training.skills : undefined;

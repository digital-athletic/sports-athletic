import { type FocusType, type SkillTypes } from "@/constants/workoutConstants";
import { ExerciseBranchType } from "./ExerciseBranch";

export type UserTrainingType = {
  weekday: number;
  skills: {
    [skillKey in SkillTypes]?: ExerciseBranchType[];
  };
  lengths: {
    [skillKey in SkillTypes]?: number;
  };
  focus: FocusType;
  /** Equipment of the day's place at plan creation; regeneration compares it. */
  equipment?: string[];
};

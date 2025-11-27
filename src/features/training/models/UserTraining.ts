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
};

import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type { MaxForceRepetitionsDataType } from "./MaxForceRepetitionsData";
import { SkillType } from "./Training";

export type UserExerciseDataType = {
  exerciseId: number;
  repetition?: number;
  weight?: number;
  nextWeightPercentage?: number;
  maxFRepetitions?: MaxForceRepetitionsDataType[];
  maxFLevelAdjustment?: ExerciseDifficultyType; // added to adjust repetitions in maxF phase different than in other
  duration?: number;
  height?: number;
  weightType?: string;
  skipped?: boolean; // save for completed workout
  set?: number[]; // [0] active run - [1] num of sets
  skill: SkillType;
  feedback: {
    difficulty: ExerciseDifficultyType;
    streakCounter?: number; //number of times that the current "difficulty" value has been chosen in a row
  };
  branchId?: string; // id of branch this exercise was taken from
};

import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type { MaxForceRepetitionsDataType } from "./MaxForceRepetitionsData";
import type { SkillCode } from "@/schemas/generator.schema";
import type { SetTuple } from "@/common/types/SetTuple";

export type UserExerciseDataType = {
  exerciseId: string;
  repetition?: number;
  weight?: number;
  nextWeightPercentage?: number;
  maxFRepetitions?: MaxForceRepetitionsDataType[];
  maxFLevelAdjustment?: ExerciseDifficultyType; // added to adjust repetitions in maxF phase different than in other
  /** Duration in seconds for timed exercises (e.g., planks, stretches, pauses) */
  duration?: number;
  height?: number;
  weightType?: string;
  skipped?: boolean; // save for completed workout
  /** Tuple of [currentSet, totalSets] */
  set?: SetTuple;
  /** Skill code from generator. Use mapSkillCodeToFocusArea() for statistics. */
  skill: SkillCode;
  feedback?: {
    difficulty: ExerciseDifficultyType;
    streakCounter?: number; //number of times that the current "difficulty" value has been chosen in a row
  };
  branchId?: string; // id of branch this exercise was taken from
};

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
  feedback?: {
    difficulty: ExerciseDifficultyType;
    streakCounter?: number; //number of times that the current "difficulty" value has been chosen in a row
  };
  branchId?: number; // id of branch this exercise was taken from
};

export const DEFAULT_USER_EXERCISE_DATA_LIST: UserExerciseDataType[] = [
  //WARMUP 3 x EX126 with P10
  {
    exerciseId: 126,
    set: [1, 3],
    repetition: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 3],
    duration: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 126,
    set: [2, 3],
    repetition: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [2, 3],
    duration: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 126,
    set: [3, 3],
    repetition: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [3, 3],
    duration: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  //STABILITY 2 x EX1 mit P20
  {
    exerciseId: 1,
    set: [1, 2],
    repetition: 8,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 2],
    duration: 20,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 1,
    set: [2, 2],
    repetition: 8,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [2, 2],
    duration: 20,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  // SWR 2 x EX2 + EX3 mit P5
  {
    exerciseId: 2,
    set: [1, 2],
    repetition: 12,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 3,
    set: [1, 2],
    repetition: 6,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 2,
    set: [2, 2],
    repetition: 12,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [2, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 3,
    set: [2, 2],
    repetition: 6,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [2, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  // SWR 2 x EX4 mit P10
  {
    exerciseId: 4,
    set: [1, 2],
    repetition: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 2],
    duration: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 4,
    set: [2, 2],
    repetition: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [2, 2],
    duration: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  // SWR 2 x EX7 + EX8 mit P15
  {
    exerciseId: 7,
    set: [1, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 2],
    duration: 15,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 8,
    set: [1, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [1, 2],
    duration: 15,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 7,
    set: [2, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 999999,
    set: [2, 2],
    duration: 15,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: 8,
    set: [2, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
];

import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type { MaxForceRepetitionsDataType } from "./MaxForceRepetitionsData";
import { PAUSE_EXERCISE_ID } from "./IdTypes";
import { SkillType } from "./Training";

/** Default exercise IDs used in sample workout data. These reference the exercise catalog. */
const DEFAULT_EXERCISE_IDS = {
  WARMUP_JUMPING_JACKS: "126",
  STABILITY_PLANK: "1",
  SWR_SQUAT: "2",
  SWR_LUNGE: "3",
  SWR_PUSHUP: "4",
  SWR_STRETCH_HIP: "7",
  SWR_STRETCH_SHOULDER: "8",
} as const;

export type UserExerciseDataType = {
  exerciseId: string;
  repetition?: number;
  weight?: number;
  nextWeightPercentage?: number;
  maxFRepetitions?: MaxForceRepetitionsDataType[];
  maxFLevelAdjustment?: ExerciseDifficultyType; // added to adjust repetitions in maxF phase different than in other
  duration?: number;
  height?: number;
  weightType?: string;
  skipped?: boolean; // save for completed workout
  /** Tuple of [currentSet, totalSets] */
  set?: [number, number];
  skill: SkillType;
  feedback?: {
    difficulty: ExerciseDifficultyType;
    streakCounter?: number; //number of times that the current "difficulty" value has been chosen in a row
  };
  branchId?: string; // id of branch this exercise was taken from
};

export const DEFAULT_USER_EXERCISE_DATA_LIST: UserExerciseDataType[] = [
  //WARMUP 3 x EX126 with P10
  {
    exerciseId: DEFAULT_EXERCISE_IDS.WARMUP_JUMPING_JACKS,
    set: [1, 3],
    repetition: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 3],
    duration: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.WARMUP_JUMPING_JACKS,
    set: [2, 3],
    repetition: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [2, 3],
    duration: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.WARMUP_JUMPING_JACKS,
    set: [3, 3],
    repetition: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [3, 3],
    duration: 10,
    skill: "WARMUP",
    feedback: { difficulty: "SUCCEEDED" },
  },
  //STABILITY 2 x EX1 mit P20
  {
    exerciseId: DEFAULT_EXERCISE_IDS.STABILITY_PLANK,
    set: [1, 2],
    repetition: 8,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 2],
    duration: 20,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.STABILITY_PLANK,
    set: [2, 2],
    repetition: 8,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [2, 2],
    duration: 20,
    skill: "STABILITY",
    feedback: { difficulty: "SUCCEEDED" },
  },
  // SWR 2 x EX2 + EX3 mit P5
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_SQUAT,
    set: [1, 2],
    repetition: 12,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_LUNGE,
    set: [1, 2],
    repetition: 6,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_SQUAT,
    set: [2, 2],
    repetition: 12,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [2, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_LUNGE,
    set: [2, 2],
    repetition: 6,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [2, 2],
    duration: 5,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  // SWR 2 x EX4 mit P10
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_PUSHUP,
    set: [1, 2],
    repetition: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 2],
    duration: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_PUSHUP,
    set: [2, 2],
    repetition: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [2, 2],
    duration: 10,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  // SWR 2 x EX7 + EX8 mit P15
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_STRETCH_HIP,
    set: [1, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 2],
    duration: 15,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_STRETCH_SHOULDER,
    set: [1, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [1, 2],
    duration: 15,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_STRETCH_HIP,
    set: [2, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: PAUSE_EXERCISE_ID,
    set: [2, 2],
    duration: 15,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
  {
    exerciseId: DEFAULT_EXERCISE_IDS.SWR_STRETCH_SHOULDER,
    set: [2, 2],
    duration: 20,
    skill: "SWR",
    feedback: { difficulty: "SUCCEEDED" },
  },
];

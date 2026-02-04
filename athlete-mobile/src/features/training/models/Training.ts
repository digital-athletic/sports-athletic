import type { ActiveTrainingType } from "./ActiveTraining";
import type { UserExerciseDataType } from "./UserExerciseData";
import type { UserProgressType } from "./UserProgress";

export type TrainingDataType = {
  selection?: TrainingSelectionType;
  exerciseList?: UserExerciseDataType[];
  progressBefore?: UserProgressType;
  equipment: string[];
  time: TrainingTimeType;
  activeTraining?: ActiveTrainingType;
};

export type TrainingSelectionType = "PLAN" | "PREV" | "QUICK";

/**
 * The 6 focus areas displayed on the radar chart and used for statistics.
 * These are the canonical categories for aggregating training time.
 */
export type FocusArea =
  | "PREVENTION"
  | "MOBILITY"
  | "SWR"
  | "WARMUP"
  | "STABILITY"
  | "CARDIO";

/**
 * Array of all focus areas in radar chart display order.
 */
export const FOCUS_AREAS: readonly FocusArea[] = [
  "MOBILITY",
  "PREVENTION",
  "CARDIO",
  "STABILITY",
  "WARMUP",
  "SWR",
] as const;

export type TrainingTimeType = {
  start?: number;
  end?: number;
  pause: number;
  skill: {
    PREVENTION: number;
    MOBILITY: number;
    SWR: number;
    WARMUP: number;
    STABILITY: number;
    CARDIO: number;
  };
};

export type TrainingType =
  | "PLAN"
  | "MOB"
  | "WU"
  | "CD"
  | "BR"
  | "STABILITY"
  | "BAS"
  | "GKS"
  | "PREV"
  | "PREVSHOULDER"
  | "PREVKNEE"
  | "PREVWRIST"
  | "PREVANKLE"
  | "PREVSPINE"
  | "TEST_WORKOUT";

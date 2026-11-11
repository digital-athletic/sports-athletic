import type { ActiveTrainingType } from "./ActiveTraining";
import type { UserExerciseDataType } from "./UserExerciseData";
import type { UserProgressType } from "./UserProgress";

export type TrainingDataType = {
  exerciseList?: UserExerciseDataType[];
  progressBefore?: UserProgressType;
  equipment: string[];
  time: TrainingTimeType;
  activeTraining?: ActiveTrainingType;
};

/** The `category` route param of the selection screen at /training/new. */
export type TrainingCategory = "plan" | "focus" | "prevention";

const TRAINING_CATEGORIES: readonly string[] = [
  "plan",
  "focus",
  "prevention",
] satisfies TrainingCategory[];

export const isTrainingCategory = (value: unknown): value is TrainingCategory =>
  typeof value === "string" && TRAINING_CATEGORIES.includes(value);

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

/**
 * PLAN, TEST_WORKOUT or the key of a short workout template. Templates can
 * come without an app release, so any key is accepted; the literals keep
 * autocompletion for the bundled ones.
 */
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
  | "TEST_WORKOUT"
  | (string & Record<never, never>);

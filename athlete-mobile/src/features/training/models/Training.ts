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

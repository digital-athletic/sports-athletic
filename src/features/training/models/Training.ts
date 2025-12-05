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

export type SkillType =
  | "PREVENTION"
  | "MOBILITY"
  | "SWR"
  | "WARMUP"
  | "STABILITY"
  | "CARDIO"
  | "SUPPORT"
  | "BLACK_ROLL"
  | "SCHNELLIGKEITSAUSDAUER_SPECIAL";

export type SkillFocusType = Exclude<
  SkillType,
  "SUPPORT" | "BLACK_ROLL" | "SCHNELLIGKEITSAUSDAUER_SPECIAL"
>;

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

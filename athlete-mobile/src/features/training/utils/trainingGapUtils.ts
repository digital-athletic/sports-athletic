import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";

export type TrainingGapAction = "NONE" | "SHIFT" | "PROMPT_NEW_PLAN";

export const getTrainingGapAction = (_days: number): TrainingGapAction => {
  throw new Error("not implemented");
};

export const daysSinceLastTraining = (
  _workoutTimestamps: number[],
  _plan: TrainingPlanType,
  _today: Date,
): number => {
  throw new Error("not implemented");
};

export const shiftPlanForTrainingGap = (
  _plan: TrainingPlanType,
  _days: number,
  _today: Date,
): TrainingPlanType => {
  throw new Error("not implemented");
};

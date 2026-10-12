import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";

export const keepUnchangedTrainingDays = (
  _oldPlan: TrainingPlanType,
  _newPlan: TrainingPlanType,
): TrainingPlanType => {
  throw new Error("not implemented");
};

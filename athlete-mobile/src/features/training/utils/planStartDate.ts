import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";

export interface PlanStartInput {
  trainingPlan: TrainingPlanType | undefined;
  sameSeasonPhase: boolean;
  workoutTimestamps: number[];
  today: Date;
}

export const planStartDateFor = (_input: PlanStartInput): Date => {
  throw new Error("not implemented");
};

import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  daysSinceLastTraining,
  getTrainingGapAction,
} from "@/features/training/utils/trainingGapUtils";
import { ISODateToDate } from "@/utils/date";

export interface PlanStartInput {
  trainingPlan: TrainingPlanType | undefined;
  sameSeasonPhase: boolean;
  workoutTimestamps: number[];
  today: Date;
}

/**
 * A rerun with the same season phase keeps the plan start, unless the training
 * gap asks for a new plan. Plan creation snaps any other start to the next Monday.
 */
export const planStartDateFor = ({
  trainingPlan,
  sameSeasonPhase,
  workoutTimestamps,
  today,
}: PlanStartInput): Date => {
  if (!trainingPlan?.start || !sameSeasonPhase) return today;
  const gapDays = daysSinceLastTraining(workoutTimestamps, trainingPlan, today);
  if (getTrainingGapAction(gapDays) === "PROMPT_NEW_PLAN") return today;
  // older plans store the start with a time
  return ISODateToDate(trainingPlan.start.split("T")[0]);
};

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
 * gap asks for a new plan.
 */
export const preservesPlanStart = ({
  trainingPlan,
  sameSeasonPhase,
  workoutTimestamps,
  today,
}: PlanStartInput): boolean => {
  if (!trainingPlan?.start || !sameSeasonPhase) return false;
  const gapDays = daysSinceLastTraining(workoutTimestamps, trainingPlan, today);
  return getTrainingGapAction(gapDays) !== "PROMPT_NEW_PLAN";
};

/** Plan creation snaps a start other than the preserved one to the next Monday. */
export const planStartDateFor = (input: PlanStartInput): Date =>
  input.trainingPlan && preservesPlanStart(input)
    ? // older plans store the start with a time
      ISODateToDate(input.trainingPlan.start.split("T")[0])
    : input.today;

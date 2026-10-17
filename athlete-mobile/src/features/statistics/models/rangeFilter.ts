import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { ISODateToDate } from "@/utils/date";

const DAY = 1000 * 60 * 60 * 24;

/** Start of the first plan section that already began, or 0 without one. */
const getPlanStartDate = (
  trainingPlan: TrainingPlanType | null,
  now: number,
): number => {
  const startTimes = (trainingPlan?.sections ?? []).map((section) =>
    ISODateToDate(section.start).getTime(),
  );
  return startTimes.find((startTime) => startTime < now) ?? 0;
};

/**
 * Gets the start timestamp of a range. Without a training plan, "total"
 * starts at 0 and covers everything.
 */
export const getRangeStartDate = (
  scale: ScaleType,
  trainingPlan: TrainingPlanType | null,
  now: number = Date.now(),
): number => {
  switch (scale) {
    case "week":
      return now - DAY * 7;
    case "month":
      return now - DAY * 30;
    case "year":
      return now - DAY * 365;
    case "total":
    default:
      return getPlanStartDate(trainingPlan, now);
  }
};

export const filterWorkoutsByRange = (
  workouts: CompleteWorkoutType[],
  scale: ScaleType,
  trainingPlan: TrainingPlanType | null = null,
  now: number = Date.now(),
): CompleteWorkoutType[] => {
  // Legacy entries can carry timestamp 0, so a plain total keeps everything.
  if (scale === "total" && !trainingPlan) return workouts;
  const startDate = getRangeStartDate(scale, trainingPlan, now);
  return workouts.filter((workout) => workout.timestamp > startDate);
};

export const filterStrengthTestsByRange = (
  history: MaxValuesType[],
  scale: ScaleType,
  now: number = Date.now(),
): MaxValuesType[] => {
  if (scale === "total") return history;
  const startDate = getRangeStartDate(scale, null, now);
  return history.filter((test) => test.testAt > startDate);
};

import { SharedConstants } from "@/constants/sharedConstants";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { extendSectionsForMissedWeeks } from "@/features/training/utils/trainingSectionUtils";
import { formatDateToISO, ISODateToDate } from "@/utils/date";

export type TrainingGapAction = "NONE" | "SHIFT" | "PROMPT_NEW_PLAN";

const SHIFT_AFTER_DAYS = 7;
const PROMPT_NEW_PLAN_AFTER_DAYS = 21;

export const getTrainingGapAction = (days: number): TrainingGapAction => {
  if (days > PROMPT_NEW_PLAN_AFTER_DAYS) return "PROMPT_NEW_PLAN";
  if (days > SHIFT_AFTER_DAYS) return "SHIFT";
  return "NONE";
};

const startOfDay = (time: number) =>
  ISODateToDate(formatDateToISO(new Date(time))).getTime();

/** A saved shift already covers the gap up to its day, so counting restarts there. */
export const daysSinceLastTraining = (
  workoutTimestamps: number[],
  plan: TrainingPlanType,
  today: Date,
): number => {
  if (workoutTimestamps.length === 0) return 0;

  const lastWorkout = startOfDay(Math.max(...workoutTimestamps));
  const lastShift = plan.gapShiftedOn
    ? ISODateToDate(plan.gapShiftedOn).getTime()
    : 0;
  const since = Math.max(lastWorkout, lastShift);

  return Math.round(
    (startOfDay(today.getTime()) - since) / SharedConstants.TIME_IN_MS.DAY,
  );
};

export const shiftPlanForTrainingGap = (
  plan: TrainingPlanType,
  days: number,
  today: Date,
): TrainingPlanType => ({
  ...plan,
  sections: extendSectionsForMissedWeeks(plan.sections, days).sections,
  gapShiftedOn: formatDateToISO(today),
});

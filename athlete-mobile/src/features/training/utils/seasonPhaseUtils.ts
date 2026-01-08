import { SharedConstants } from "@/constants/sharedConstants";
import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { DDMMYYYYToDate } from "@/utils/date";

/**
 * Calculate number of weeks from now until season phase end date
 * Ensures minimum of 1 week
 */
export const calculateNumOfWeeks = (endDate: string): number => {
  const endMs = DDMMYYYYToDate(endDate).getTime();
  const nowMs = Date.now();
  const weeks = Math.floor((endMs - nowMs) / SharedConstants.TIME_IN_MS.WEEK);
  return Math.max(1, weeks);
};

/**
 * Calculate number of weeks from start date to season phase end date
 */
export const calculateNumOfWeeksFromDate = (
  endDate: string,
  startDate: Date,
): number => {
  const endMs = DDMMYYYYToDate(endDate).getTime();
  const startMs = startDate.getTime();
  const weeks = Math.floor((endMs - startMs) / SharedConstants.TIME_IN_MS.WEEK);
  return Math.max(1, weeks);
};

/**
 * Enrich season phase with numOfWeeks calculated from now
 */
export const enrichSeasonPhaseWithWeeks = (
  phase: SeasonPhaseType,
): SeasonPhaseType => {
  return {
    ...phase,
    numOfWeeks: calculateNumOfWeeks(phase.endDate),
  };
};

/**
 * Enrich season phase with numOfWeeks calculated from start date
 */
export const enrichSeasonPhaseWithWeeksFromDate = (
  phase: SeasonPhaseType,
  startDate: Date,
): SeasonPhaseType => {
  return {
    ...phase,
    numOfWeeks: calculateNumOfWeeksFromDate(phase.endDate, startDate),
  };
};

import { SharedConstants } from "@/constants/sharedConstants";
import { dateToISODate, ISODateToDate } from "@/utils/date";

/**
 * Calculate number of weeks passed since a given start date
 * @param start - Start date in ISO 8601 format (YYYY-MM-DD)
 */
export const getPassedWeeksSinceDate = (start: string): number => {
  const now = new Date();
  // ISODateToDate handles both ISO 8601 and legacy DD-MM-YYYY formats
  return Math.floor(
    (now.getTime() - ISODateToDate(start).getTime()) /
      SharedConstants.TIME_IN_MS.WEEK,
  );
};

type DeriveSeasonPhaseEndDateArgs = {
  /** Start date in ISO 8601 format (YYYY-MM-DD) */
  start: string;
  numOfWeeks: number;
};

/**
 * Derive end date for a season phase
 * @returns End date in ISO 8601 format (YYYY-MM-DD)
 */
export const deriveSeasonPhaseEndDate = (
  args: DeriveSeasonPhaseEndDateArgs | undefined,
) => {
  // Fallback to 12 weeks from now if no training plan exists
  if (!args) {
    const twelveWeeksInMs = SharedConstants.TIME_IN_MS.WEEK * 12;
    const futureEndDateMs = Date.now() + twelveWeeksInMs;
    return dateToISODate(new Date(futureEndDateMs));
  }

  // ISODateToDate handles both ISO 8601 and legacy DD-MM-YYYY formats
  const sectionStartMs = ISODateToDate(args.start).getTime();
  const sectionEndMs =
    sectionStartMs + SharedConstants.TIME_IN_MS.WEEK * args.numOfWeeks;
  return dateToISODate(new Date(sectionEndMs));
};

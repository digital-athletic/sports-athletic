import { SharedConstants } from "@/constants/sharedConstants";
import { formatDateToISO, ISODateToDate } from "@/utils/date";

/**
 * Calculate number of weeks passed since a given start date
 * @param start - Start date in ISO 8601 format (YYYY-MM-DD)
 */
export const getPassedWeeksSinceDate = (start: string): number => {
  const now = new Date();
  return Math.floor(
    (now.getTime() - ISODateToDate(start).getTime()) /
      SharedConstants.TIME_IN_MS.WEEK,
  );
};

type SectionDates = {
  /** Start date in ISO 8601 format (YYYY-MM-DD) */
  start: string;
  numOfWeeks: number;
};

const sectionEndMs = ({ start, numOfWeeks }: SectionDates): number =>
  ISODateToDate(start).getTime() + SharedConstants.TIME_IN_MS.WEEK * numOfWeeks;

/**
 * Derive end date for a season phase
 * @returns End date in ISO 8601 format (YYYY-MM-DD)
 */
export const deriveSeasonPhaseEndDate = (args: SectionDates | undefined) => {
  // Fallback to 12 weeks from now without a running training plan
  if (!args) {
    const twelveWeeksInMs = SharedConstants.TIME_IN_MS.WEEK * 12;
    const futureEndDateMs = Date.now() + twelveWeeksInMs;
    return formatDateToISO(new Date(futureEndDateMs));
  }

  return formatDateToISO(new Date(sectionEndMs(args)));
};

export const isPlanEnded = (
  plan: { sections: SectionDates[] } | null | undefined,
  today: Date,
): boolean => {
  const lastSection = plan?.sections.at(-1);
  return (
    lastSection !== undefined && sectionEndMs(lastSection) < today.getTime()
  );
};

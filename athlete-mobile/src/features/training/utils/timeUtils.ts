import { SharedConstants } from "@/constants/sharedConstants";
import { dateToDDMMYYYY, DDMMYYYYToDate } from "@/utils/date";

export const getPassedWeeksSinceDate = (
  start: string, // DD-MM-YYYY
): number => {
  const now = new Date();
  return Math.floor(
    (now.getTime() - DDMMYYYYToDate(start).getTime()) /
      SharedConstants.TIME_IN_MS.WEEK,
  );
};

type DeriveSeasonPhaseEndDateArgs = {
  start: string; // DD-MM-YYYY
  numOfWeeks: number;
};

export const deriveSeasonPhaseEndDate = (
  args: DeriveSeasonPhaseEndDateArgs | undefined,
) => {
  // Fallback to 12 weeks from now if no training plan exists
  if (!args) {
    const twelveWeeksInMs = SharedConstants.TIME_IN_MS.WEEK * 12;
    const futureEndDateMs = Date.now() + twelveWeeksInMs;
    return dateToDDMMYYYY(new Date(futureEndDateMs));
  }

  const sectionStartMs = DDMMYYYYToDate(args.start).getTime();
  const sectionEndMs =
    sectionStartMs + SharedConstants.TIME_IN_MS.WEEK * args.numOfWeeks;
  return dateToDDMMYYYY(new Date(sectionEndMs));
};

import { SharedConstants } from "@/constants/sharedConstants";

export const getPassedWeeksSinceDate = (startDate: string): number => {
  const now = new Date();
  const start = new Date(startDate);
  return Math.floor(
    (now.getTime() - start.getTime()) / SharedConstants.TIME_IN_MS.WEEK,
  );
};

import { type TrainingSectionType } from "./models/TrainingSection";
import { getPassedWeeksSinceDate } from "./utils/timeUtils";

export const useActiveSectionIndex = (
  trainingSections: TrainingSectionType[],
): number => {
  if (trainingSections.length === 0) return -1;

  const weeksPassed = getPassedWeeksSinceDate(trainingSections[0].start);

  let weekCount = 0;
  for (let i = 0; i < trainingSections.length; i++) {
    weekCount += trainingSections[i].numOfWeeks;
    if (weekCount > weeksPassed) {
      return i;
    }
  }

  return trainingSections.length - 1;
};

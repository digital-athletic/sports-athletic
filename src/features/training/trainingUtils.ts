import { TrainingSectionType } from "./models/TrainingSection";

export const getSectionForDate = (
  sections: TrainingSectionType[],
  timestamp: number,
) => {
  let sectionsNotInFuture = sections.filter((sec) => {
    return new Date(sec.start).getTime() <= timestamp;
  });
  let currSec = sectionsNotInFuture.reduce((max, sec) => {
    if (new Date(sec.start).getTime() > new Date(max.start).getTime()) {
      return sec;
    }
    return max;
  }, sectionsNotInFuture[0]);

  if (typeof currSec === "undefined") {
    // fallback set first section
    currSec = sections[0];
  }
  return currSec;
};

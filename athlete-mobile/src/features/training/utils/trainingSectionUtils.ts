import { TrainingSectionType } from "../models/TrainingSection";

export const getIntensityForSection = (
  sectionType: TrainingSectionType["type"],
): number => {
  switch (sectionType) {
    case "SWR1":
    case "SWR1KG":
      return 6;
    case "SWR2":
    case "SWR2KG":
      return 7;
    case "SA":
    case "SAKG":
      return 8;
    case "SK":
    case "SKKG":
      return 9;
    case "MAX":
    case "MAX_KRAFT":
      return 10;
    default:
      return 10;
  }
};

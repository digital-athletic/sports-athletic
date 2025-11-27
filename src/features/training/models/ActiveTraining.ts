import { CardioTypes, SectionTypes } from "@/constants/workoutConstants";

export type ActiveTrainingType = {
  type: string;
  sectionIndex?: number;
  weekday?: number;
  sectionType?: SectionTypes;
  sectionCardioType?: CardioTypes;
  trainingFocus?: "PHASE" | "CARDIO" | "STABILITY" | "COMBINED";
};

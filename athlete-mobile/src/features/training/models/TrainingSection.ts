import {
  type CardioTypes,
  type SectionTypes,
} from "@/constants/workoutConstants";
import { type UserTrainingType } from "./UserTraining";

export type TrainingSectionType = {
  /** Start date in ISO 8601 format (YYYY-MM-DD) */
  start: string;
  numOfWeeks: number;
  type: SectionTypes;
  cardioType: CardioTypes;
  trainings: UserTrainingType[];
};

// Intermediate type: section with start date but no trainings yet
export type SectionWithStartType = Omit<TrainingSectionType, "trainings">;

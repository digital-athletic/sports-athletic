import {
  type CardioTypes,
  type SectionTypes,
} from "@/constants/workoutConstants";
import { type UserTrainingType } from "./UserTraining";

export type TrainingSectionType = {
  start: string; // DD-MM-YYYY
  numOfWeeks: number;
  type: SectionTypes;
  cardioType: CardioTypes;
  trainings: UserTrainingType[];
};

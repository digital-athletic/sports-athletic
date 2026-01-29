import {
  type CardioTypes,
  type SectionTypes,
} from "@/constants/workoutConstants";
import { type UserTrainingType } from "./UserTraining";

/**
 * Training section with explicit type definitions.
 *
 * Note: This manual type differs from TrainingSectionSchemaType which uses
 * looseObject for validation flexibility. The schema type has optional fields
 * to accept data with missing properties during validation, while this type
 * represents the expected runtime structure with required fields.
 */
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

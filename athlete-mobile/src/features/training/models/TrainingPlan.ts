import {
  type SectionWithStartType,
  type TrainingSectionType,
} from "./TrainingSection";

/**
 * Training plan with explicit type definitions.
 *
 * Note: This manual type differs from TrainingPlanSchemaType which is used
 * for validation. The schema uses looseObject for sections to accept data
 * with extra properties, while this type represents the expected runtime
 * structure with explicit field definitions.
 */
export type TrainingPlanType = {
  /** Training plan start date in ISO 8601 format (YYYY-MM-DD) */
  start: string;
  sections: TrainingSectionType[];
};

// Intermediate type: plan before trainings are generated for each section
export type TrainingPlanInitialType = {
  /** Training plan start date in ISO 8601 format (YYYY-MM-DD) */
  start: string;
  sections: SectionWithStartType[];
};

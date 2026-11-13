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
  /** Shape of every training day in the plan; a plan never mixes the two. */
  format?: PlanFormat;
  sections: TrainingSectionType[];
  /** Day (YYYY-MM-DD) the sections were last shifted for a training gap */
  gapShiftedOn?: string;
};

/**
 * `legacy`: the training days store copied branches and minutes per skill.
 * `aiwl`: the training days store AIWL workouts.
 */
export type PlanFormat = "legacy" | "aiwl";

/** Reads the format of a plan. A plan without a format is a legacy plan. */
export const readPlanFormat = (plan: TrainingPlanType): PlanFormat =>
  plan.format ?? "legacy";

// Intermediate type: plan before trainings are generated for each section
export type TrainingPlanInitialType = {
  /** Training plan start date in ISO 8601 format (YYYY-MM-DD) */
  start: string;
  sections: SectionWithStartType[];
};

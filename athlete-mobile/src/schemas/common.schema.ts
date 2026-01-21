import * as v from "valibot";

export const TrainingLevelSchema = v.picklist([
  "default",
  "beginner",
  "intermediate",
  "advanced",
  "professional",
]);
export type TrainingLevelType = v.InferOutput<typeof TrainingLevelSchema>;

export const isTrainingLevel = (value: unknown): value is TrainingLevelType =>
  v.safeParse(TrainingLevelSchema, value).success;

export const TrainingParameterSchema = v.picklist([
  "duration",
  "height",
  "repetition",
  "weight",
]);
export type TrainingParameterType = v.InferOutput<
  typeof TrainingParameterSchema
>;

export const isTrainingParameter = (
  value: unknown,
): value is TrainingParameterType =>
  v.safeParse(TrainingParameterSchema, value).success;

export const ValueTypeTypeSchema = v.picklist([
  "weightFMax",
  "weightAbsolute",
  "Unknown",
  "Single",
]);
export type ValueTypeType = v.InferOutput<typeof ValueTypeTypeSchema>;

export const GenderTagSchema = v.picklist(["default", "m", "w", "k"]);
export type GenderTagType = v.InferOutput<typeof GenderTagSchema>;

export const CardioTypesSchema = v.picklist([
  "ZONE_1",
  "ZONE_1_SHORT",
  "ZONE_1_LAKTAT",
  "ZONE_2",
  "ZONE_3",
  "ZONE_4",
  "ZONE_5",
]);
export type CardioTypesSchemaType = v.InferOutput<typeof CardioTypesSchema>;

export const SectionTypesSchema = v.picklist([
  "SWR1",
  "SWR1KG",
  "SWR2",
  "SWR2KG",
  "MAX",
  "MAX_KRAFT",
  "SK",
  "SKKG",
  "SAKG",
  "SA",
]);
export type SectionTypesSchemaType = v.InferOutput<typeof SectionTypesSchema>;

export const SeasonPhaseEnumSchema = v.picklist([
  "PAUSE",
  "PREPATORY",
  "COMPETITION",
]);
export type SeasonPhaseEnumType = v.InferOutput<typeof SeasonPhaseEnumSchema>;

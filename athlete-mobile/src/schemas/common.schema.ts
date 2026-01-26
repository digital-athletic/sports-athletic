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
  "CARDIO_1",
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
]);

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

export const SeasonPhaseEnumSchema = v.picklist([
  "PAUSE",
  "PREPATORY",
  "COMPETITION",
]);

export const LevelTagSchema = v.picklist([
  "BEGINNER",
  "ADVANCED",
  "PROFESSIONAL",
]);
export type LevelTagSchemaType = v.InferOutput<typeof LevelTagSchema>;

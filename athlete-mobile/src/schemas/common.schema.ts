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

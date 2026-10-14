import * as v from "valibot";
import {
  TrainingLevelSchema,
  TrainingParameterSchema,
  ValueTypeTypeSchema,
} from "./common.schema";

// Accept both strings and numbers for training level values (numbers preferred)
const TrainingLevelValuesSchema = v.record(
  TrainingLevelSchema,
  v.union([v.string(), v.number()]),
);

const ValueTypeSchema = v.object({
  default: v.optional(TrainingLevelValuesSchema),
  m: v.optional(TrainingLevelValuesSchema),
  w: v.optional(TrainingLevelValuesSchema),
  k: v.optional(TrainingLevelValuesSchema),
  type: v.optional(v.object({ type: ValueTypeTypeSchema })),
});
export type ValueType = v.InferOutput<typeof ValueTypeSchema>;

const ExerciseValuesTypeSchema = v.object({
  startValue: ValueTypeSchema,
  targetValue: ValueTypeSchema,
});
export type ExerciseValuesType = v.InferOutput<typeof ExerciseValuesTypeSchema>;

const ExerciseValuesSchema = v.record(
  TrainingParameterSchema,
  ExerciseValuesTypeSchema,
);
export type ExerciseValues = v.InferOutput<typeof ExerciseValuesSchema>;

export const ExerciseSchema = v.object({
  id: v.string(),
  level: v.object({ m: v.number(), w: v.number() }),
  name: v.string(),
  displayName: v.union([v.string(), v.null()]),
  description: v.union([v.string(), v.null()]),
  picture: v.union([v.string(), v.null()]),
  video: v.union([v.string(), v.null()]),
  values: v.union([ExerciseValuesSchema, v.null()]),
  tags: v.array(v.string()),
  isAdvanceByReps: v.boolean(),
  isAdvanceByDuration: v.boolean(),
  isJump: v.boolean(),
  otherSideExerciseId: v.optional(v.union([v.string(), v.null()])),
  equivalentExercises: v.optional(v.array(v.string())),
  /** Share of the movement direction's barbell 1RM; replaces the generic equipment conversion. */
  conversionFactor: v.optional(v.number()),
});
export type ExerciseType = v.InferOutput<typeof ExerciseSchema>;

export const ExercisesArraySchema = v.array(ExerciseSchema);

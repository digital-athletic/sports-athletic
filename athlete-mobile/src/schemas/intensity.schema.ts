import * as v from "valibot";
import type { IntensityData } from "@/features/training/models/Intensity";
import { ValueTypeTypeSchema } from "./common.schema";

const FeedbackStepSchema = v.strictObject({
  TOO_EASY: v.number(),
  SUCCEEDED: v.number(),
  TOO_HARD: v.number(),
});

const byLevel = <TEntry extends v.GenericSchema>(entry: TEntry) =>
  v.partial(
    v.strictObject({
      default: entry,
      beginner: entry,
      intermediate: entry,
      advanced: entry,
      professional: entry,
    }),
  );

const byGenderAndLevel = <TEntry extends v.GenericSchema>(entry: TEntry) =>
  v.partial(
    v.strictObject({
      default: byLevel(entry),
      m: byLevel(entry),
      w: byLevel(entry),
      k: byLevel(entry),
    }),
  );

const AdjustmentSchema = v.partial(
  v.strictObject({
    duration: byGenderAndLevel(FeedbackStepSchema),
    height: byGenderAndLevel(FeedbackStepSchema),
    repetition: byGenderAndLevel(FeedbackStepSchema),
    weight: byGenderAndLevel(FeedbackStepSchema),
    weightFMax: byGenderAndLevel(FeedbackStepSchema),
    weightAbsolute: byGenderAndLevel(FeedbackStepSchema),
  }),
);

const valueByGenderAndLevel = v.partial(
  v.strictObject({
    default: byLevel(v.number()),
    m: byLevel(v.number()),
    w: byLevel(v.number()),
    k: byLevel(v.number()),
    type: v.strictObject({ type: ValueTypeTypeSchema }),
  }),
);

const IntensityValueSchema = v.partial(
  v.strictObject({
    duration: valueByGenderAndLevel,
    height: valueByGenderAndLevel,
    repetition: valueByGenderAndLevel,
    weight: valueByGenderAndLevel,
  }),
);

// The annotation makes the compiler check the output against the documented IntensityData.
export const IntensityConfigSchema: v.GenericSchema<IntensityData> =
  v.strictObject({
    overridesExerciseRepsAndDuration: v.optional(v.boolean()),
    lowestPermittedWeight: v.optional(v.number()),
    adjustment: AdjustmentSchema,
    startValue: IntensityValueSchema,
    targetValue: IntensityValueSchema,
  });

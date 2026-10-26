import * as v from "valibot";

import {
  BlockValuesSchema,
  CatalogRestSchema,
  CountSchema,
  TemplateSchema,
  type Block,
} from "./aiwl.schema";
import { SkillCodeSchema } from "./generator.schema";

const PositiveSecondsSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const NonEmptyStringSchema = v.pipe(v.string(), v.minLength(1));

// The list fixes selection and order, so an ID twice would change neither;
// repeated sets belong to the builder.
const ExerciseIdsSchema = v.pipe(
  v.array(NonEmptyStringSchema),
  v.minLength(1),
  v.check(
    (ids) => new Set(ids).size === ids.length,
    "An exercises block lists each exercise once",
  ),
);

// The schema checks the structure only; the set list stage rejects a setting
// the builder of the block's skill does not read.
const ExercisesBlockSchema = v.strictObject({
  kind: v.literal("exercises"),
  skill: SkillCodeSchema,
  exercises: ExerciseIdsSchema,
  sets: v.optional(CountSchema),
  setDuration: v.optional(PositiveSecondsSchema),
  values: v.optional(BlockValuesSchema),
  rest: v.optional(v.partial(CatalogRestSchema)),
});
export type ExercisesBlock = v.InferOutput<typeof ExercisesBlockSchema>;

// The AIWL block kinds stay as the shared schema defines them; only the
// strength test template adds the exercises block.
const AiwlBlockSchema = TemplateSchema.entries.blocks.item;

/**
 * The strength test template: an AIWL template whose blocks may also be
 * exercises blocks. Short workouts and custom workouts keep TemplateSchema.
 */
export const StrengthTestTemplateSchema = v.strictObject({
  ...TemplateSchema.entries,
  blocks: v.pipe(
    v.array(
      v.variant("kind", [...AiwlBlockSchema.options, ExercisesBlockSchema]),
    ),
    v.minLength(1),
  ),
});
export type StrengthTestTemplate = v.InferOutput<
  typeof StrengthTestTemplateSchema
>;

/** Any block the new generator walks: an AIWL block or an exercises block. */
export type WorkoutBlock = Block | ExercisesBlock;

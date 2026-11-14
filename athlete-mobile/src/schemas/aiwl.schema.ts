import * as v from "valibot";

import { SkillCodeSchema } from "./generator.schema";

const SecondsSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
const PositiveSecondsSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
export const CountSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const NonEmptyStringSchema = v.pipe(v.string(), v.minLength(1));

const LocalizedTextSchema = v.objectWithRest(
  { en: NonEmptyStringSchema },
  NonEmptyStringSchema,
);

export const CountBySchema = v.picklist(["exercises", "entries", "pairs"]);
export type CountBy = v.InferOutput<typeof CountBySchema>;
export const SupersetSchema = v.picklist([
  "none",
  "muscles",
  "drawOrder",
  "drawOrderWithLeftovers",
]);
export type Superset = v.InferOutput<typeof SupersetSchema>;
const BlockOrderSchema = v.picklist(["asDrawn", "muscleGroups"]);
const BlockValuesSchema = v.picklist(["skill", "exercise"]);
export type BlockValues = v.InferOutput<typeof BlockValuesSchema>;

// Named BlockPick because Pick shadows the TypeScript utility type.
const BlockPickSchema = v.strictObject({
  tags: v.array(NonEmptyStringSchema),
  count: CountSchema,
});
export type BlockPick = v.InferOutput<typeof BlockPickSchema>;
const BlockPicksSchema = v.pipe(v.array(BlockPickSchema), v.minLength(1));
export type BlockPicks = v.InferOutput<typeof BlockPicksSchema>;
const PlacePicksSchema = v.union([
  BlockPicksSchema,
  v.strictObject({
    withWeights: BlockPicksSchema,
    withoutWeights: BlockPicksSchema,
  }),
]);
export type PlacePicks = v.InferOutput<typeof PlacePicksSchema>;

export const RestSchema = v.strictObject({
  withinSuperset: SecondsSchema,
  betweenSets: SecondsSchema,
  afterExercise: SecondsSchema,
});
export type Rest = v.InferOutput<typeof RestSchema>;
export const CatalogRestSchema = v.strictObject({
  ...RestSchema.entries,
  afterBlock: v.optional(SecondsSchema),
});
export type CatalogRest = v.InferOutput<typeof CatalogRestSchema>;
const BlockRestSchema = v.partial(CatalogRestSchema);

const BodyPartsSchema = v.strictObject({
  regions: v.optional(
    v.array(v.picklist(["upperBody", "lowerBody", "core", "fullBody"])),
  ),
  muscles: v.optional(v.array(NonEmptyStringSchema)),
});

const blockBase = {
  skill: SkillCodeSchema,
  order: v.optional(BlockOrderSchema),
  countBy: v.optional(CountBySchema),
  fallbackToWholeTree: v.optional(v.boolean()),
  superset: v.optional(SupersetSchema),
  sets: v.optional(CountSchema),
  setDuration: v.optional(PositiveSecondsSchema),
  values: v.optional(BlockValuesSchema),
  rest: v.optional(BlockRestSchema),
};
const PicksBlockSchema = v.strictObject({
  kind: v.literal("picks"),
  ...blockBase,
  picks: PlacePicksSchema,
  bodyParts: v.optional(BodyPartsSchema),
});
const DurationBlockSchema = v.strictObject({
  kind: v.literal("duration"),
  ...blockBase,
  duration: PositiveSecondsSchema,
  bodyParts: v.optional(BodyPartsSchema),
});
const BranchesBlockSchema = v.strictObject({
  kind: v.literal("branches"),
  ...blockBase,
  branches: v.pipe(v.array(NonEmptyStringSchema), v.minLength(1)),
  duration: v.optional(PositiveSecondsSchema),
});

/** A part of a load: above 0, at most the whole load. */
export const ShareSchema = v.pipe(v.number(), v.gtValue(0), v.maxValue(1));

// share is the part of the test set load a set lifts; "amrap" marks the set
// the athlete lifts as often as possible.
const TestSetSchema = v.strictObject({
  share: ShareSchema,
  repetitions: v.union([CountSchema, v.literal("amrap")]),
  rest: SecondsSchema,
});
export type TestSet = v.InferOutput<typeof TestSetSchema>;

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
  rest: v.optional(BlockRestSchema),
  testSets: v.optional(v.pipe(v.array(TestSetSchema), v.minLength(1))),
});
export type ExercisesBlock = v.InferOutput<typeof ExercisesBlockSchema>;

const BlockSchema = v.variant("kind", [
  PicksBlockSchema,
  DurationBlockSchema,
  BranchesBlockSchema,
  ExercisesBlockSchema,
]);
export type PicksBlock = v.InferOutput<typeof PicksBlockSchema>;
export type Block = v.InferOutput<typeof BlockSchema>;
/** A block whose handler selects branches: every block kind but exercises. */
export type BranchSelectingBlock = Exclude<Block, ExercisesBlock>;

export const TemplateSchema = v.strictObject({
  $schema: v.optional(v.string()),
  aiwl: v.literal(1),
  id: NonEmptyStringSchema,
  name: LocalizedTextSchema,
  description: v.optional(LocalizedTextSchema),
  blocks: v.pipe(v.array(BlockSchema), v.minLength(1)),
});
export type Template = v.InferOutput<typeof TemplateSchema>;

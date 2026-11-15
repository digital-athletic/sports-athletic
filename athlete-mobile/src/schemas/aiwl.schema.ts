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
// "none" adds the other side of a one-sided exercise; "singles" trains each
// exercise alone, without its other side, in draw order.
export const SupersetSchema = v.picklist([
  "none",
  "singles",
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

/** The set list builder a skill runs with. */
export type SkillSetListKind = "cardio" | "maxStrength" | "standard";

/**
 * Names the set list builder of a skill: cardio first, then max strength,
 * else standard. Set list building and the block schema both read it.
 *
 * readSkillSetListKind("CARDIO_5") → "cardio"
 * readSkillSetListKind("MAX_STRENGTH") → "maxStrength"
 */
export const readSkillSetListKind = (skill: string): SkillSetListKind => {
  if (skill.includes("CARDIO")) return "cardio";
  if (skill.includes("MAX")) return "maxStrength";
  return "standard";
};

// A max strength block always trains each exercise with its other side,
// lower body first, so "singles" cannot be authored on one.
const MAX_STRENGTH_SINGLES_MESSAGE =
  'superset "singles" is not allowed on a max strength block';

const isAllowedSuperset = ({
  skill,
  superset,
}: {
  skill: string;
  superset?: Superset;
}): boolean =>
  superset !== "singles" || readSkillSetListKind(skill) !== "maxStrength";

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
const PicksBlockEntriesSchema = v.strictObject({
  kind: v.literal("picks"),
  ...blockBase,
  picks: PlacePicksSchema,
  bodyParts: v.optional(BodyPartsSchema),
});
const PicksBlockSchema = v.pipe(
  PicksBlockEntriesSchema,
  v.forward(
    v.check<v.InferOutput<typeof PicksBlockEntriesSchema>, string>(
      isAllowedSuperset,
      MAX_STRENGTH_SINGLES_MESSAGE,
    ),
    ["superset"],
  ),
);
const DurationBlockEntriesSchema = v.strictObject({
  kind: v.literal("duration"),
  ...blockBase,
  duration: PositiveSecondsSchema,
  bodyParts: v.optional(BodyPartsSchema),
});
const DurationBlockSchema = v.pipe(
  DurationBlockEntriesSchema,
  v.forward(
    v.check<v.InferOutput<typeof DurationBlockEntriesSchema>, string>(
      isAllowedSuperset,
      MAX_STRENGTH_SINGLES_MESSAGE,
    ),
    ["superset"],
  ),
);
const BranchesBlockEntriesSchema = v.strictObject({
  kind: v.literal("branches"),
  ...blockBase,
  branches: v.pipe(v.array(NonEmptyStringSchema), v.minLength(1)),
  duration: v.optional(PositiveSecondsSchema),
});
const BranchesBlockSchema = v.pipe(
  BranchesBlockEntriesSchema,
  v.forward(
    v.check<v.InferOutput<typeof BranchesBlockEntriesSchema>, string>(
      isAllowedSuperset,
      MAX_STRENGTH_SINGLES_MESSAGE,
    ),
    ["superset"],
  ),
);

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

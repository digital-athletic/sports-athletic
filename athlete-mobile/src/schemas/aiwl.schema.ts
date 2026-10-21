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
const BlockRestSchema = v.partial(RestSchema);

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
const BlockSchema = v.variant("kind", [
  PicksBlockSchema,
  DurationBlockSchema,
  BranchesBlockSchema,
]);
export type PicksBlock = v.InferOutput<typeof PicksBlockSchema>;
export type Block = v.InferOutput<typeof BlockSchema>;

export const TemplateSchema = v.strictObject({
  $schema: v.optional(v.string()),
  aiwl: v.literal(1),
  id: NonEmptyStringSchema,
  name: LocalizedTextSchema,
  description: v.optional(LocalizedTextSchema),
  blocks: v.pipe(v.array(BlockSchema), v.minLength(1)),
});
export type Template = v.InferOutput<typeof TemplateSchema>;

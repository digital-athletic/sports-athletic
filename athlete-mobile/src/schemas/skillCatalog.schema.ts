import * as v from "valibot";

import {
  CountBySchema,
  CountSchema,
  RestSchema,
  SupersetSchema,
} from "./aiwl.schema";
import { SkillCodeSchema } from "./generator.schema";
import { FocusAreaSchema } from "./sync.schema";

const SkillTreeNamesSchema = v.pipe(
  v.array(v.pipe(v.string(), v.minLength(1))),
  v.minLength(1),
);

const timingEntries = {
  intensity: v.optional(v.pipe(v.string(), v.minLength(1))),
  intensityWithoutWeights: v.optional(v.pipe(v.string(), v.minLength(1))),
  superset: v.optional(SupersetSchema),
  sets: v.optional(CountSchema),
  rest: v.optional(RestSchema),
  startRepetitions: v.optional(CountSchema),
  startDuration: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
};

const SkillTreeCatalogEntrySchema = v.strictObject({
  ...timingEntries,
  skillTree: v.strictObject({
    withWeights: SkillTreeNamesSchema,
    withoutWeights: SkillTreeNamesSchema,
  }),
  focusArea: v.optional(FocusAreaSchema),
  progression: v.optional(v.boolean()),
  painRegions: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
  countBy: v.optional(CountBySchema),
  fallbackToWholeTree: v.optional(v.boolean()),
});
export type SkillTreeCatalogEntry = v.InferOutput<
  typeof SkillTreeCatalogEntrySchema
>;

const TREE_ONLY_KEYS = [
  "skillTree",
  "focusArea",
  "progression",
  "painRegions",
  "countBy",
  "fallbackToWholeTree",
] as const;

// Optional never fields let code read entry.skillTree on any entry and get undefined.
const TimingCatalogEntrySchema = v.strictObject({
  ...timingEntries,
  skillTree: v.optional(v.never()),
  focusArea: v.optional(v.never()),
  progression: v.optional(v.never()),
  painRegions: v.optional(v.never()),
  countBy: v.optional(v.never()),
  fallbackToWholeTree: v.optional(v.never()),
});

// A tree-only key or an empty entry selects the tree schema, so its issues
// name the missing skillTree instead of a failed alternative.
const isTimingOnly = (input: unknown): boolean =>
  typeof input === "object" &&
  input !== null &&
  Object.keys(input).length > 0 &&
  TREE_ONLY_KEYS.every((key) => !Object.hasOwn(input, key));

export const SkillCatalogEntrySchema = v.lazy((input) =>
  isTimingOnly(input) ? TimingCatalogEntrySchema : SkillTreeCatalogEntrySchema,
);
export type SkillCatalogEntry = v.InferOutput<typeof SkillCatalogEntrySchema>;

export const hasSkillTree = (
  entry: SkillCatalogEntry,
): entry is SkillTreeCatalogEntry => entry.skillTree !== undefined;

export const SkillCatalogSchema = v.record(
  SkillCodeSchema,
  SkillCatalogEntrySchema,
);
export type SkillCatalog = v.InferOutput<typeof SkillCatalogSchema>;

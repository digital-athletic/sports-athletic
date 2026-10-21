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

export const SkillCatalogEntrySchema = v.strictObject({
  skillTree: v.strictObject({
    withWeights: SkillTreeNamesSchema,
    withoutWeights: SkillTreeNamesSchema,
  }),
  intensity: v.optional(v.pipe(v.string(), v.minLength(1))),
  intensityWithoutWeights: v.optional(v.pipe(v.string(), v.minLength(1))),
  focusArea: v.optional(FocusAreaSchema),
  progression: v.optional(v.boolean()),
  painRegions: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
  countBy: v.optional(CountBySchema),
  fallbackToWholeTree: v.optional(v.boolean()),
  superset: v.optional(SupersetSchema),
  sets: v.optional(CountSchema),
  rest: v.optional(RestSchema),
});
export type SkillCatalogEntry = v.InferOutput<typeof SkillCatalogEntrySchema>;

export const SkillCatalogSchema = v.record(
  SkillCodeSchema,
  SkillCatalogEntrySchema,
);
export type SkillCatalog = v.InferOutput<typeof SkillCatalogSchema>;

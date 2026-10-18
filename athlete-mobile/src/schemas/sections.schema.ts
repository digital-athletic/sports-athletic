import * as v from "valibot";
import type { SectionPrefix } from "@/features/training/models/SectionPrefix";

// A default text plus optional translations keyed by language code.
const withDefaultLocale = <T extends v.GenericSchema>(schema: T) =>
  v.objectWithRest({ default: schema }, schema);

const LocalizedTargetSchema = v.strictObject({
  normal: v.array(v.string()),
  highlight: v.array(v.string()),
});

export const SectionDataSchema = v.strictObject({
  target: withDefaultLocale(LocalizedTargetSchema),
  speed: v.strictObject({
    values: withDefaultLocale(v.array(v.string())),
    description: withDefaultLocale(v.string()),
  }),
});
export type SectionData = v.InferOutput<typeof SectionDataSchema>;

export const SectionVideoDataSchema = v.strictObject({
  picture: v.string(),
  video: v.string(),
  title: v.string(),
});
export type SectionVideoData = v.InferOutput<typeof SectionVideoDataSchema>;

// Typed against SectionPrefix, so a new prefix breaks the build until the schema lists it.
const bySectionPrefix = <T extends v.GenericSchema>(schema: T) =>
  v.strictObject({
    SWR: schema,
    MAX: schema,
    SK: schema,
    SA: schema,
  } satisfies Record<SectionPrefix, T>);

export const SectionsFileSchema = v.strictObject({
  SECTIONS_DATA: bySectionPrefix(SectionDataSchema),
  SECTIONS_VIDEOS: bySectionPrefix(SectionVideoDataSchema),
});
export type SectionsFile = v.InferOutput<typeof SectionsFileSchema>;

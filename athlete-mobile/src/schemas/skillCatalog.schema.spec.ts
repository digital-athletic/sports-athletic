import * as v from "valibot";

import { SkillCatalogEntrySchema } from "./skillCatalog.schema";

type Json = Record<string, unknown>;

const skillTree = {
  withWeights: ["GKS"],
  withoutWeights: ["GKSKG"],
};

const gksEntry: Json = {
  skillTree,
  intensity: "GKS",
  intensityWithoutWeights: "GKSKG",
  focusArea: "STABILITY",
  progression: true,
  countBy: "entries",
  fallbackToWholeTree: true,
  superset: "none",
  sets: 2,
  rest: { withinSuperset: 45, betweenSets: 90, afterExercise: 60 },
};

const firstIssuePath = (data: unknown): string | undefined => {
  const result = v.safeParse(SkillCatalogEntrySchema, data);
  if (result.success) return undefined;
  return (result.issues[0].path ?? [])
    .map((item) => String(item.key))
    .join(".");
};

describe("SkillCatalogEntrySchema: accepts", () => {
  it.each<[string, unknown]>([
    ["the GKS entry without title and description", gksEntry],
    ["an entry with only skillTree", { skillTree }],
    [
      "an entry with painRegions",
      { ...gksEntry, painRegions: ["KNEE", "HIP"] },
    ],
  ])("%s", (_label, data) => {
    expect(v.safeParse(SkillCatalogEntrySchema, data).success).toBe(true);
  });
});

describe("SkillCatalogEntrySchema: rejects", () => {
  it.each<[string, unknown, string]>([
    ["a missing skillTree", {}, "skillTree"],
    [
      "a skillTree without withoutWeights",
      { skillTree: { withWeights: ["GKS"] } },
      "skillTree.withoutWeights",
    ],
    [
      "an empty withWeights list",
      { skillTree: { withWeights: [], withoutWeights: ["GKSKG"] } },
      "skillTree.withWeights",
    ],
    [
      "a partial rest",
      { ...gksEntry, rest: { afterExercise: 60 } },
      "rest.withinSuperset",
    ],
    [
      "afterBlock in the catalog rest",
      { ...gksEntry, rest: { ...(gksEntry.rest as Json), afterBlock: 30 } },
      "rest.afterBlock",
    ],
    ["values in the catalog", { ...gksEntry, values: "exercise" }, "values"],
    ["focusArea STRENGTH", { ...gksEntry, focusArea: "STRENGTH" }, "focusArea"],
    ["an empty intensity", { ...gksEntry, intensity: "" }, "intensity"],
    [
      "an empty painRegions entry",
      { ...gksEntry, painRegions: [""] },
      "painRegions.0",
    ],
    [
      "an empty string in a skillTree list",
      { skillTree: { withWeights: [""], withoutWeights: ["GKSKG"] } },
      "skillTree.withWeights.0",
    ],
    ["sets 0", { ...gksEntry, sets: 0 }, "sets"],
    ["the unknown key minutes", { ...gksEntry, minutes: 10 }, "minutes"],
    [
      "the key title",
      { ...gksEntry, title: { en: "Full body stability" } },
      "title",
    ],
    [
      "the key description",
      { ...gksEntry, description: { en: "Trains the whole body." } },
      "description",
    ],
    [
      "the key requiredEquipment",
      { ...gksEntry, requiredEquipment: ["FOAM_ROLLER"] },
      "requiredEquipment",
    ],
    [
      "the key regionFilter",
      { ...gksEntry, regionFilter: true },
      "regionFilter",
    ],
  ])("%s", (_label, data, path) => {
    expect(firstIssuePath(data)).toBe(path);
  });
});

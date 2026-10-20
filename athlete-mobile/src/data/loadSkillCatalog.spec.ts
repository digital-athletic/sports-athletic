import { loadFocusTraining } from "./loadFocusTrainings";
import { loadIntensityConfig } from "./loadIntensityConfig";
import {
  loadSkillCatalog,
  loadSkillCatalogEntry,
  parseSkillCatalog,
} from "./loadSkillCatalog";
import { getAllSkillTrees } from "./skillTreeRegistry";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import type { CountBy } from "@/schemas/aiwl.schema";
import type { SkillCatalogEntry } from "@/schemas/skillCatalog.schema";

const TEMPLATE_IDS = [
  "WU",
  "MOB",
  "BR",
  "CD",
  "BAS",
  "GKS",
  "STABILITY",
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];
const CODES = [...TEMPLATE_IDS, "WUSPEZIAL"];

const COUNT_BY_OF_DRAW: Record<string, CountBy> = {
  slots: "entries",
  exercises: "exercises",
  pairs: "pairs",
};

const entryOf = (code: string): SkillCatalogEntry => {
  const entry = loadSkillCatalogEntry(code);
  if (!entry) throw new Error(`no catalog entry for ${code}`);
  return entry;
};

// The old block that generates the skill: a block names its skill or defaults to the training key.
const oldBlockOf = (id: string, code: string) => {
  const block = loadFocusTraining(id)?.blocks.find(
    (candidate) => (candidate.skill ?? id) === code,
  );
  if (!block) throw new Error(`no old block for ${code} in ${id}`);
  return block;
};

const treeNamesOf = (entry: SkillCatalogEntry): string[] => [
  ...entry.skillTree.withWeights,
  ...entry.skillTree.withoutWeights,
];

describe("loadSkillCatalog: real file", () => {
  it("lists exactly the 14 skill codes", () => {
    expect(Object.keys(loadSkillCatalog()).sort()).toEqual([...CODES].sort());
  });

  it("returns the same frozen value on every call", () => {
    const first = loadSkillCatalog();

    expect(loadSkillCatalog()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("returns the catalog value for a known code", () => {
    expect(loadSkillCatalogEntry("GKS")).toBeDefined();
    expect(loadSkillCatalogEntry("GKS")).toBe(loadSkillCatalog().GKS);
  });

  it.each(["PLAN", "constructor", "PREVKG"])(
    "returns undefined for %s",
    (code) => {
      expect(loadSkillCatalogEntry(code)).toBeUndefined();
    },
  );

  it.each(CODES)("sets every generation default for %s", (code) => {
    const entry = entryOf(code);

    expect(entry.countBy).toBeDefined();
    expect(entry.fallbackToWholeTree).toBeDefined();
    expect(entry.superset).toBeDefined();
    expect(entry.sets).toBeDefined();
    expect(entry.rest).toBeDefined();
  });

  it.each(CODES)("names skill trees that hold branches for %s", (code) => {
    const trees = getAllSkillTrees();

    treeNamesOf(entryOf(code)).forEach((name) =>
      expect(Object.keys(trees[name] ?? {}).length).toBeGreaterThan(0),
    );
  });

  it.each(CODES)("names intensity configurations that load for %s", (code) => {
    const { intensity, intensityWithoutWeights } = entryOf(code);

    [intensity, intensityWithoutWeights]
      .filter((name): name is string => name !== undefined)
      .forEach((name) => expect(() => loadIntensityConfig(name)).not.toThrow());
  });
});

describe("loadSkillCatalog: parity with the plan workout defaults", () => {
  const generator = new TrainingGenerator();

  it.each(CODES)("matches the plan set count and superset for %s", (code) => {
    const entry = entryOf(code);

    expect(entry.sets).toBe(generator.getSetCountBySkill(code, "BEGINNER"));
    expect(entry.superset).toBe(
      generator.isSuperset(code) ? "muscles" : "none",
    );
  });

  it.each(CODES)("matches the plan rest times for %s", (code) => {
    expect(entryOf(code).rest).toEqual({
      withinSuperset: generator.getInSetPauseBySkill(code),
      betweenSets: generator.getSingleExerciseRestBySkill(code),
      afterExercise: generator.getAfterSetPauseBySkill(code),
    });
  });
});

// Temporary until the slice that deletes focusTrainings.json.
describe("loadSkillCatalog: parity with the old focus training templates", () => {
  it.each(TEMPLATE_IDS)("matches the template facts for %s", (id) => {
    const entry = entryOf(id);
    const old = loadFocusTraining(id);

    expect(entry.focusArea).toBe(old?.focusArea);
    expect(entry.intensity).toBe(old?.intensity);
    expect(entry.intensityWithoutWeights).toBe(old?.intensityWithoutWeights);
    expect(entry.progression).toBe(old?.progression);
    expect(entry.painRegions).toEqual(old?.regions);
  });

  it.each(TEMPLATE_IDS)("matches the block draw facts for %s", (id) => {
    const entry = entryOf(id);
    const block = oldBlockOf(id, id);

    expect(entry.countBy).toBe(COUNT_BY_OF_DRAW[block.draw]);
    expect(entry.fallbackToWholeTree).toBe(block.fallback);
  });

  it("matches the draw facts of the special warm up block", () => {
    const entry = entryOf("WUSPEZIAL");
    const block = oldBlockOf("PREVKNEE", "WUSPEZIAL");

    expect(entry.countBy).toBe(COUNT_BY_OF_DRAW[block.draw]);
    expect(entry.fallbackToWholeTree).toBe(block.fallback);
  });
});

describe("loadSkillCatalog: WUSPEZIAL keeps the plan workout behavior", () => {
  it("is a warm up", () => {
    expect(entryOf("WUSPEZIAL").focusArea).toBe("WARMUP");
  });

  it("sets no intensity", () => {
    const entry = entryOf("WUSPEZIAL");

    expect(entry.intensity).toBeUndefined();
    expect(entry.intensityWithoutWeights).toBeUndefined();
  });

  it("leaves progression unset", () => {
    expect(entryOf("WUSPEZIAL").progression).toBeUndefined();
  });

  it("sets no pain regions", () => {
    expect(entryOf("WUSPEZIAL").painRegions).toBeUndefined();
  });
});

describe("parseSkillCatalog: error paths", () => {
  it("names the path of an empty skill tree list", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseSkillCatalog({
        WU: { skillTree: { withWeights: [], withoutWeights: ["WU"] } },
      }),
    ).toThrow("WU.skillTree.withWeights: ");
  });
});

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

interface Facts {
  focusArea: SkillCatalogEntry["focusArea"];
  intensity?: string;
  intensityWithoutWeights?: string;
  progression?: boolean;
  painRegions?: string[];
  countBy: CountBy;
  fallbackToWholeTree: boolean;
}

const prevention = (painRegions?: string[]): Facts => ({
  focusArea: "PREVENTION",
  intensity: "PREV",
  progression: true,
  painRegions,
  countBy: "pairs",
  fallbackToWholeTree: false,
});
const timed = (focusArea: Facts["focusArea"]): Facts => ({
  focusArea,
  progression: false,
  countBy: "entries",
  fallbackToWholeTree: false,
});

const FACTS: Record<string, Facts> = {
  WU: timed("WARMUP"),
  MOB: timed("MOBILITY"),
  BR: timed("MOBILITY"),
  CD: timed("WARMUP"),
  BAS: {
    focusArea: "STABILITY",
    intensity: "BAS",
    progression: true,
    countBy: "entries",
    fallbackToWholeTree: true,
  },
  GKS: {
    focusArea: "STABILITY",
    intensity: "GKS",
    intensityWithoutWeights: "GKSKG",
    progression: true,
    countBy: "entries",
    fallbackToWholeTree: true,
  },
  STABILITY: {
    focusArea: "STABILITY",
    progression: true,
    countBy: "exercises",
    fallbackToWholeTree: false,
  },
  PREV: prevention(),
  PREVSHOULDER: prevention(["SHOULDER"]),
  PREVKNEE: prevention(["KNEE", "HIP", "KNEE_HIP"]),
  PREVWRIST: prevention(["WRIST", "ELBOW", "WRIST_ELBOW"]),
  PREVANKLE: prevention(["ANKLE"]),
  PREVSPINE: prevention(["SPINE"]),
  WUSPEZIAL: {
    focusArea: "WARMUP",
    countBy: "exercises",
    fallbackToWholeTree: false,
  },
};

const entryOf = (code: string): SkillCatalogEntry => {
  const entry = loadSkillCatalogEntry(code);
  if (!entry) throw new Error(`no catalog entry for ${code}`);
  return entry;
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

describe("loadSkillCatalog: bundled facts", () => {
  it.each(Object.entries(FACTS))("holds the facts of %s", (code, facts) => {
    const entry = entryOf(code);

    expect(entry.focusArea).toBe(facts.focusArea);
    expect(entry.intensity).toBe(facts.intensity);
    expect(entry.intensityWithoutWeights).toBe(facts.intensityWithoutWeights);
    expect(entry.progression).toBe(facts.progression);
    expect(entry.painRegions).toEqual(facts.painRegions);
    expect(entry.countBy).toBe(facts.countBy);
    expect(entry.fallbackToWholeTree).toBe(facts.fallbackToWholeTree);
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

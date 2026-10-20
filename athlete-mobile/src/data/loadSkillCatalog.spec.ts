import { loadIntensityConfig } from "./loadIntensityConfig";
import {
  loadSkillCatalog,
  loadSkillCatalogEntry,
  parseSkillCatalog,
} from "./loadSkillCatalog";
import { getAllSkillTrees } from "./skillTreeRegistry";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import type { CountBy } from "@/schemas/aiwl.schema";
import {
  hasSkillTree,
  type SkillCatalogEntry,
} from "@/schemas/skillCatalog.schema";

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
const TREE_CODES = [...TEMPLATE_IDS, "WUSPEZIAL"];
const TIMING_CODES = [
  "WUSKSA",
  "SWR1",
  "SWR1KG",
  "SWR2",
  "SWR2KG",
  "SK",
  "SKKG",
  "SA",
  "SAKG",
  "SAS",
  "GKSKG",
  "MAX",
  "MAX_STRENGTH",
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
];
const CODES = [...TREE_CODES, ...TIMING_CODES];
const WITHOUT_TIMING = [
  "MAX",
  "MAX_STRENGTH",
  "CARDIO_1_SHORT",
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
];
const FITNESS_LEVELS = ["BEGINNER", "ADVANCED", "PROFESSIONAL"];

interface Timing {
  sets?: number;
  rest?: [number, number, number];
  superset?: SkillCatalogEntry["superset"];
  intensity?: string;
  startRepetitions?: number;
  startDuration?: number;
}

// rest reads withinSuperset / betweenSets / afterExercise
const TIMING: Record<string, Timing> = {
  WU: { sets: 1, rest: [10, 10, 30], superset: "muscles" },
  MOB: { sets: 1, rest: [10, 10, 10], superset: "muscles" },
  BR: { sets: 1, rest: [10, 10, 10], superset: "muscles" },
  CD: { sets: 1, rest: [10, 10, 10], superset: "muscles" },
  BAS: { sets: 2, rest: [30, 60, 60], superset: "muscles", intensity: "BAS" },
  GKS: { sets: 2, rest: [45, 90, 60], superset: "none", intensity: "GKS" },
  STABILITY: { sets: 2, rest: [30, 60, 60], superset: "muscles" },
  PREV: { sets: 2, rest: [30, 60, 60], superset: "muscles", intensity: "PREV" },
  PREVSHOULDER: {
    sets: 2,
    rest: [30, 60, 60],
    superset: "muscles",
    intensity: "PREV",
  },
  PREVKNEE: {
    sets: 2,
    rest: [30, 60, 60],
    superset: "muscles",
    intensity: "PREV",
  },
  PREVWRIST: {
    sets: 2,
    rest: [30, 60, 60],
    superset: "muscles",
    intensity: "PREV",
  },
  PREVANKLE: {
    sets: 2,
    rest: [30, 60, 60],
    superset: "muscles",
    intensity: "PREV",
  },
  PREVSPINE: {
    sets: 2,
    rest: [30, 60, 60],
    superset: "muscles",
    intensity: "PREV",
  },
  WUSPEZIAL: { sets: 1, rest: [10, 10, 10], superset: "muscles" },
  WUSKSA: {
    sets: 1,
    rest: [30, 30, 30],
    superset: "muscles",
    intensity: "WUSKSA",
  },
  SWR1: { sets: 2, rest: [30, 90, 60], superset: "muscles" },
  SWR1KG: { sets: 2, rest: [30, 90, 60], superset: "muscles" },
  SWR2: { sets: 2, rest: [30, 90, 60], superset: "muscles" },
  SWR2KG: { sets: 2, rest: [30, 90, 60], superset: "muscles" },
  SK: { sets: 2, rest: [60, 180, 60], superset: "muscles", intensity: "SK" },
  SKKG: {
    sets: 2,
    rest: [60, 180, 60],
    superset: "muscles",
    intensity: "SKKG",
  },
  SA: { sets: 2, rest: [75, 180, 75], superset: "muscles", intensity: "SA" },
  SAKG: {
    sets: 2,
    rest: [75, 180, 75],
    superset: "muscles",
    intensity: "SAKG",
  },
  SAS: {
    sets: 2,
    rest: [10, 10, 10],
    superset: "none",
    intensity: "DEFAULTKG",
  },
  GKSKG: {
    sets: 2,
    rest: [45, 90, 60],
    superset: "none",
    intensity: "DEFAULTKG",
  },
  MAX: { superset: "none", intensity: "DEFAULT" },
  MAX_STRENGTH: { superset: "none", intensity: "DEFAULT" },
  CARDIO_1_SHORT: {
    intensity: "CARDIO_1_SHORT",
    startRepetitions: 3,
    startDuration: 10,
  },
  CARDIO_1_LAKTAT: {
    intensity: "CARDIO_1_LAKTAT",
    startRepetitions: 3,
    startDuration: 30,
  },
  CARDIO_2: { intensity: "CARDIO_2", startRepetitions: 3, startDuration: 60 },
  CARDIO_3: { intensity: "CARDIO_3", startRepetitions: 3, startDuration: 120 },
  CARDIO_4: {
    intensity: "DEFAULTKG",
    startRepetitions: 3,
    startDuration: 1800,
  },
  CARDIO_5: {
    intensity: "DEFAULTKG",
    startRepetitions: 3,
    startDuration: 600,
  },
};

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

const treeNamesOf = (entry: SkillCatalogEntry): string[] => {
  if (!hasSkillTree(entry)) throw new Error("entry names no skill tree");
  return [...entry.skillTree.withWeights, ...entry.skillTree.withoutWeights];
};

describe("loadSkillCatalog: real file", () => {
  it("lists exactly the 33 skill codes", () => {
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

  it.each(TREE_CODES)("sets every generation default for %s", (code) => {
    const entry = entryOf(code);

    expect(entry.countBy).toBeDefined();
    expect(entry.fallbackToWholeTree).toBeDefined();
    expect(entry.superset).toBeDefined();
    expect(entry.sets).toBeDefined();
    expect(entry.rest).toBeDefined();
  });

  it.each(TREE_CODES)("names skill trees that hold branches for %s", (code) => {
    const trees = getAllSkillTrees();

    treeNamesOf(entryOf(code)).forEach((name) =>
      expect(Object.keys(trees[name] ?? {}).length).toBeGreaterThan(0),
    );
  });

  it.each(TIMING_CODES)("names no skill tree for %s", (code) => {
    expect(entryOf(code).skillTree).toBeUndefined();
  });

  it.each(CODES)("names intensity configurations that load for %s", (code) => {
    const { intensity, intensityWithoutWeights } = entryOf(code);

    [intensity, intensityWithoutWeights]
      .filter((name): name is string => name !== undefined)
      .forEach((name) => expect(() => loadIntensityConfig(name)).not.toThrow());
  });
});

describe("loadSkillCatalog: timing and start values", () => {
  const restOf = (rest: Timing["rest"]) =>
    rest && {
      withinSuperset: rest[0],
      betweenSets: rest[1],
      afterExercise: rest[2],
    };

  it.each(CODES)("holds the timing and start values of %s", (code) => {
    const entry = entryOf(code);
    const expected = TIMING[code];

    expect({
      sets: entry.sets,
      rest: entry.rest,
      superset: entry.superset,
      intensity: entry.intensity,
      startRepetitions: entry.startRepetitions,
      startDuration: entry.startDuration,
    }).toEqual({ ...expected, rest: restOf(expected.rest) });
  });

  it.each(WITHOUT_TIMING)("omits sets and rest for %s", (code) => {
    const entry = entryOf(code);

    expect(entry.sets).toBeUndefined();
    expect(entry.rest).toBeUndefined();
  });

  it.each(CODES.filter((code) => !WITHOUT_TIMING.includes(code)))(
    "defines sets and rest for %s",
    (code) => {
      const entry = entryOf(code);

      expect(entry.sets).toBeDefined();
      expect(entry.rest).toBeDefined();
    },
  );
});

describe("loadSkillCatalog: parity with the plan workout defaults", () => {
  const generator = new TrainingGenerator();
  const withSets = CODES.filter((code) => !WITHOUT_TIMING.includes(code));
  const withSuperset = CODES.filter((code) => TIMING[code].superset);

  it.each(
    withSets.flatMap((code) => FITNESS_LEVELS.map((level) => [code, level])),
  )("matches the plan set count for %s at %s", (code, level) => {
    expect(entryOf(code).sets).toBe(generator.getSetCountBySkill(code, level));
  });

  it.each(withSuperset)("matches the plan superset for %s", (code) => {
    expect(entryOf(code).superset).toBe(
      generator.isSuperset(code) ? "muscles" : "none",
    );
  });

  it.each(withSets)("matches the plan rest times for %s", (code) => {
    expect(entryOf(code).rest).toEqual({
      withinSuperset: generator.getInSetPauseBySkill(code),
      betweenSets: generator.getSingleExerciseRestBySkill(code),
      afterExercise: generator.getAfterSetPauseBySkill(code),
    });
  });

  it.each(CODES)("matches the plan start values for %s", (code) => {
    const entry = entryOf(code);

    expect(entry.startRepetitions ?? 8).toBe(
      generator.getRepetitionDefaultBySkill(code),
    );
    expect(entry.startDuration ?? 30).toBe(
      generator.getDurationDefaultBySkill(code),
    );
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

describe("parseSkillCatalog: entry kinds", () => {
  const timing = {
    sets: 2,
    rest: { withinSuperset: 30, betweenSets: 90, afterExercise: 60 },
    superset: "muscles",
    intensity: "SK",
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("accepts a timing-only entry without a skill tree", () => {
    expect(parseSkillCatalog({ SK: timing }).SK).toEqual(timing);
  });

  it("accepts a timing-only entry without sets and rest", () => {
    expect(parseSkillCatalog({ MAX: { superset: "none" } }).MAX).toEqual({
      superset: "none",
    });
  });

  it("accepts start values on a timing-only entry", () => {
    const entry = { ...timing, startRepetitions: 3, startDuration: 120 };

    expect(parseSkillCatalog({ CARDIO_3: entry }).CARDIO_3).toEqual(entry);
  });

  it("accepts start values on an entry with a skill tree", () => {
    const entry = {
      skillTree: { withWeights: ["WU"], withoutWeights: ["WU"] },
      startRepetitions: 8,
      startDuration: 30,
    };

    expect(parseSkillCatalog({ WU: entry }).WU).toEqual(entry);
  });

  it.each([
    ["focusArea", { focusArea: "SWR" }],
    ["progression", { progression: true }],
    ["painRegions", { painRegions: ["KNEE"] }],
    ["countBy", { countBy: "entries" }],
    ["fallbackToWholeTree", { fallbackToWholeTree: false }],
  ])("rejects %s on a timing-only entry", (_field, extra) => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => parseSkillCatalog({ SK: { ...timing, ...extra } })).toThrow();
  });

  it.each([0, 1.5])("rejects a start duration of %s", (startDuration) => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseSkillCatalog({ SK: { ...timing, startDuration } }),
    ).toThrow();
  });

  it("rejects a start repetition count of 0", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseSkillCatalog({ SK: { ...timing, startRepetitions: 0 } }),
    ).toThrow();
  });
});

describe("loadSkillCatalog: timing invariant", () => {
  it.each(Object.keys(loadSkillCatalog()))(
    "defines sets and rest together or neither for %s",
    (code) => {
      const entry = entryOf(code);

      expect(entry.sets === undefined).toBe(entry.rest === undefined);
    },
  );
});

describe("parseSkillCatalog: error paths", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("names the path of an empty skill tree list", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseSkillCatalog({
        WU: { skillTree: { withWeights: [], withoutWeights: ["WU"] } },
      }),
    ).toThrow("WU.skillTree.withWeights: ");
  });
});

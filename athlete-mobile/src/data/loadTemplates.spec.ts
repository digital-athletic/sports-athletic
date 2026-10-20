import { loadSkillCatalogEntry } from "./loadSkillCatalog";
import {
  loadTemplate,
  loadTemplateName,
  loadTemplates,
  parseTemplates,
} from "./loadTemplates";
import { getAllSkillTrees } from "./skillTreeRegistry";
import { filterByTags } from "@/features/training/generators/focusTrainingSelection";
import type {
  BlockPick,
  PicksBlock,
  PlacePicks,
  Rest,
  Template,
} from "@/schemas/aiwl.schema";
import type { SkillCatalogEntry } from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";

const IDS = [
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
const PLACES = ["withWeights", "withoutWeights"] as const;
type Place = (typeof PLACES)[number];

const NAMES: Record<string, { en: string; de: string }> = {
  WU: { en: "Warm-Up", de: "Warm-Up" },
  MOB: { en: "Mobility", de: "Mobilität" },
  BR: { en: "Loosen muscles", de: "Muskeln lockern" },
  CD: { en: "Cool-Down", de: "Cool-Down" },
  BAS: { en: "Leg axis stability", de: "Beinachsenstabilität" },
  GKS: { en: "Full body stability", de: "Ganzkörperstabilität" },
  STABILITY: { en: "Stability", de: "Stabilität" },
  PREV: { en: "Prevention", de: "Prävention" },
  PREVSHOULDER: { en: "Shoulder prevention", de: "Schulterprävention" },
  PREVKNEE: { en: "Knee and hip prevention", de: "Knie- und Hüftprävention" },
  PREVWRIST: {
    en: "Elbow and wrist prevention",
    de: "Ellbogen- und Handgelenksprävention",
  },
  PREVANKLE: { en: "Ankle prevention", de: "Sprunggelenksprävention" },
  PREVSPINE: { en: "Spine prevention", de: "Wirbelsäulenprävention" },
};

type Resolved = ReturnType<typeof effective>;

type Shape = Omit<Resolved, "rest" | "setDuration">;

const resolved = (
  shape: Shape,
  [withinSuperset, betweenSets, afterExercise]: [number, number, number],
  setDuration?: number,
): Resolved => ({
  ...shape,
  setDuration,
  rest: { withinSuperset, betweenSets, afterExercise },
});

const timed = (afterExercise: number) =>
  resolved(
    { countBy: "entries", fallbackToWholeTree: false, sets: 1, superset: "none" },
    [10, 10, afterExercise],
    60,
  );
const preventionBlocks = (): Resolved[] => [
  resolved(
    {
      countBy: "exercises",
      fallbackToWholeTree: false,
      sets: 1,
      superset: "muscles",
    },
    [10, 10, 10],
  ),
  resolved(
    {
      countBy: "pairs",
      fallbackToWholeTree: false,
      sets: 2,
      superset: "drawOrderWithLeftovers",
    },
    [30, 60, 60],
  ),
];

const RESOLVED: Record<string, Resolved[]> = {
  WU: [timed(10)],
  MOB: [timed(10)],
  BR: [timed(10)],
  CD: [timed(10)],
  BAS: [
    resolved(
      { countBy: "entries", fallbackToWholeTree: true, sets: 2, superset: "drawOrder" },
      [30, 60, 30],
    ),
  ],
  GKS: [
    resolved(
      { countBy: "entries", fallbackToWholeTree: true, sets: 2, superset: "none" },
      [45, 90, 45],
    ),
  ],
  STABILITY: [
    resolved(
      { countBy: "exercises", fallbackToWholeTree: false, sets: 2, superset: "muscles" },
      [30, 60, 60],
    ),
  ],
  PREV: preventionBlocks(),
  PREVSHOULDER: preventionBlocks(),
  PREVKNEE: preventionBlocks(),
  PREVWRIST: preventionBlocks(),
  PREVANKLE: preventionBlocks(),
  PREVSPINE: preventionBlocks(),
};

const bothPlaces = (blocks: BlockPick[][]): Record<Place, BlockPick[][]> => ({
  withWeights: blocks,
  withoutWeights: blocks,
});
const anyExercises = (count: number) => bothPlaces([[{ tags: [], count }]]);
const preventionPicks = (region: string) =>
  bothPlaces([
    [
      {
        tags: [
          "SKILL_WU",
          "SKILL_WARM_UP",
          "SKILL_WARM_UP_SPECIAL",
          `PREVENTION_${region}`,
        ],
        count: 3,
      },
    ],
    [{ tags: ["SKILL_PREVENTION", `PREVENTION_${region}`], count: 3 }],
  ]);

const PICKS: Record<string, Record<Place, BlockPick[][]>> = {
  WU: anyExercises(10),
  MOB: anyExercises(10),
  BR: anyExercises(10),
  CD: anyExercises(10),
  BAS: anyExercises(4),
  GKS: {
    withWeights: [[{ tags: [], count: 4 }]],
    withoutWeights: [
      [
        { tags: ["REGION_UPPER_BODY"], count: 3 },
        { tags: ["REGION_FULL_BODY"], count: 2 },
      ],
    ],
  },
  STABILITY: anyExercises(6),
  PREV: preventionPicks("SHOULDER"),
  PREVSHOULDER: preventionPicks("SHOULDER"),
  PREVKNEE: preventionPicks("KNEE_HIP"),
  PREVWRIST: preventionPicks("WRIST_ELBOW"),
  PREVANKLE: preventionPicks("ANKLE"),
  PREVSPINE: preventionPicks("SPINE"),
};

const templateOf = (id: string): Template => {
  const template = loadTemplate(id);
  if (!template) throw new Error(`no template ${id}`);
  return template;
};

const blocksOf = (id: string): PicksBlock[] =>
  templateOf(id).blocks.map((block) => {
    if (block.kind !== "picks")
      throw new Error(`${id} has a ${block.kind} block`);
    return block;
  });

const entryOf = (code: string): SkillCatalogEntry => {
  const entry = loadSkillCatalogEntry(code);
  if (!entry) throw new Error(`no catalog entry for ${code}`);
  return entry;
};

const picksAt = (picks: PlacePicks, place: Place): BlockPick[] =>
  Array.isArray(picks) ? picks : picks[place];

const effective = (block: PicksBlock) => {
  const entry = entryOf(block.skill);
  return {
    countBy: block.countBy ?? entry.countBy,
    fallbackToWholeTree: block.fallbackToWholeTree ?? entry.fallbackToWholeTree,
    sets: block.sets ?? entry.sets,
    superset: block.superset ?? entry.superset,
    setDuration: block.setDuration,
    rest: { ...entry.rest, ...block.rest },
  };
};

const validGks = {
  aiwl: 1,
  id: "GKS",
  name: { en: "Full body stability", de: "Ganzkörperstabilität" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 4 }] }],
};

describe("loadTemplates: real files", () => {
  it("has the 13 templates", () => {
    expect(Object.keys(loadTemplates()).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("keys the template %s by its id", (id) => {
    expect(loadTemplates()[id].id).toBe(id);
  });

  it("returns the same frozen value on every call", () => {
    const first = loadTemplates();

    expect(loadTemplates()).toBe(first);
    expect(Object.isFrozen(first.WU.blocks[0])).toBe(true);
  });

  it("returns the template value for a known id", () => {
    expect(loadTemplate("GKS")).toBe(loadTemplates().GKS);
  });

  it.each(["PLAN", "constructor"])("returns undefined for %s", (id) => {
    expect(loadTemplate(id)).toBeUndefined();
  });

  it.each(IDS)("has only picks blocks in %s", (id) => {
    expect(() => blocksOf(id)).not.toThrow();
  });

  it.each(IDS)("names catalog skills in the blocks of %s", (id) => {
    blocksOf(id).forEach((block) =>
      expect(loadSkillCatalogEntry(block.skill)).toBeDefined(),
    );
  });
});

describe("loadTemplateName", () => {
  it("returns the German name for German", () => {
    expect(loadTemplateName("PREVKNEE", "de")).toBe("Knie- und Hüftprävention");
  });

  it.each(["fr", undefined])("returns the English name for %s", (language) => {
    expect(loadTemplateName("PREVKNEE", language)).toBe(
      "Knee and hip prevention",
    );
  });

  it("returns undefined for an unknown id", () => {
    expect(loadTemplateName("PLAN", "en")).toBeUndefined();
  });
});

describe("loadTemplates: no redundant block override", () => {
  it.each(IDS)("overrides only values that differ in %s", (id) => {
    const redundant = blocksOf(id).flatMap((block, index) => {
      const entry = entryOf(block.skill);
      const fields = (
        ["countBy", "fallbackToWholeTree", "superset", "sets"] as const
      )
        .filter((field) => block[field] === entry[field])
        .map((field) => `${index}.${field}`);
      const rest = (Object.keys(block.rest ?? {}) as (keyof Rest)[])
        .filter((key) => block.rest?.[key] === entry.rest?.[key])
        .map((key) => `${index}.rest.${key}`);
      return [...fields, ...rest];
    });

    expect(redundant).toEqual([]);
  });
});

describe("loadTemplates: bundled values", () => {
  it.each(IDS)("names %s", (id) => {
    expect(templateOf(id).name).toEqual(NAMES[id]);
  });

  it.each(IDS)("names the block skills of %s", (id) => {
    const skills = blocksOf(id).map((block) => block.skill);

    expect(skills).toEqual(
      id.startsWith("PREV")
        ? ["WUSPEZIAL", id]
        : [id],
    );
  });

  it.each(IDS)("resolves the block values of %s", (id) => {
    expect(blocksOf(id).map(effective)).toEqual(RESOLVED[id]);
  });

  it.each(IDS.flatMap((id) => PLACES.map((place) => [id, place] as const)))(
    "holds the picks of %s %s",
    (id, place) => {
      expect(blocksOf(id).map((block) => picksAt(block.picks, place))).toEqual(
        PICKS[id][place],
      );
    },
  );
});

describe("loadTemplates: pool guard", () => {
  it.each(IDS.flatMap((id) => PLACES.map((place) => [id, place] as const)))(
    "matches a branch of the skill trees for every pick of %s %s",
    (id, place) => {
      const trees = getAllSkillTrees();
      const unmatched = blocksOf(id).flatMap((block, index) => {
        const branches: SkillTreeType = {};
        entryOf(block.skill).skillTree[place].forEach((name) =>
          Object.assign(branches, trees[name]),
        );
        return picksAt(block.picks, place)
          .filter(
            (pick) =>
              Object.keys(filterByTags(branches, pick.tags)).length === 0,
          )
          .map((pick) => `${index}: ${pick.tags.join(",")}`);
      });

      expect(unmatched).toEqual([]);
    },
  );
});

describe("parseTemplates: error paths", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("accepts a valid file", () => {
    expect(parseTemplates({ GKS: validGks }).GKS.id).toBe("GKS");
  });

  it("throws when the file key and the id differ", () => {
    expect(() => parseTemplates({ GKS: { ...validGks, id: "WU" } })).toThrow(
      "GKS.id",
    );
  });

  it("names the path of a bad pick", () => {
    const badPick = {
      ...validGks,
      blocks: [{ ...validGks.blocks[0], picks: [{ tags: [], count: 0 }] }],
    };

    expect(() => parseTemplates({ GKS: badPick })).toThrow(
      "GKS.blocks[0].picks",
    );
  });
});

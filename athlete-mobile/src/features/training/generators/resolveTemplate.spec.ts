import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  getSkillTree,
  readLiteralSkillTree,
} from "@/features/training/utils/skillTreeUtils";
import type { Block, PicksBlock, Template } from "@/schemas/aiwl.schema";
import type { SkillCatalogEntry } from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import { filterByTags } from "./focusTrainingSelection";
import {
  resolveShortWorkoutPlan,
  type ShortWorkoutPlan,
} from "./resolveTemplate";

const mockExtraTemplates: Record<string, Template> = {};
const mockExtraCatalog: Record<string, SkillCatalogEntry> = {};

jest.mock("@/data/loadTemplates", () => {
  const actual = jest.requireActual<typeof import("@/data/loadTemplates")>(
    "@/data/loadTemplates",
  );
  return {
    ...actual,
    loadTemplates: () => ({ ...actual.loadTemplates(), ...mockExtraTemplates }),
    loadTemplate: (id: string) =>
      Object.hasOwn(mockExtraTemplates, id)
        ? mockExtraTemplates[id]
        : actual.loadTemplate(id),
  };
});

jest.mock("@/data/loadSkillCatalog", () => {
  const actual = jest.requireActual<typeof import("@/data/loadSkillCatalog")>(
    "@/data/loadSkillCatalog",
  );
  return {
    ...actual,
    loadSkillCatalog: () => ({
      ...actual.loadSkillCatalog(),
      ...mockExtraCatalog,
    }),
    loadSkillCatalogEntry: (code: string) =>
      Object.hasOwn(mockExtraCatalog, code)
        ? mockExtraCatalog[code]
        : actual.loadSkillCatalogEntry(code),
  };
});

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
const WEIGHTS = [WorkoutConstants.EQUIPMENT.DUMBBELL];
const PLACES = [
  { label: "with weights", equipment: WEIGHTS, hasWeights: true },
  { label: "without weights", equipment: [], hasWeights: false },
];

const trees = getAllSkillTrees();

const branch = (tags: string[]): SkillTreeType[string] => ({
  tags,
  levels: { 1: { exerciseId: "1" } },
});
const tree = (entries: Record<string, string[]>): SkillTreeType =>
  Object.fromEntries(
    Object.entries(entries).map(([id, tags]) => [id, branch(tags)]),
  );

const fullEntry: SkillCatalogEntry = {
  skillTree: { withWeights: ["WU"], withoutWeights: ["WU"] },
  countBy: "entries",
  fallbackToWholeTree: false,
  superset: "none",
  sets: 2,
  rest: { withinSuperset: 1, betweenSets: 1, afterExercise: 1 },
};

const picksBlock = (change: Partial<PicksBlock> = {}): PicksBlock => ({
  kind: "picks",
  skill: "WU",
  picks: [{ tags: [], count: 1 }],
  ...change,
});
const addTemplate = (id: string, blocks: Block[]): void => {
  mockExtraTemplates[id] = { aiwl: 1, id, name: { en: id }, blocks };
};
const planOf = (
  id: string,
  hasWeights = false,
  from = trees,
): ShortWorkoutPlan =>
  resolveShortWorkoutPlan(id, from, hasWeights ? WEIGHTS : []);
const thrown = (run: () => unknown): unknown => {
  try {
    run();
  } catch (e) {
    return e;
  }
  return undefined;
};
const pickMatches = (
  pool: SkillTreeType,
  tagLists: string[][],
): SkillTreeType =>
  Object.fromEntries(
    Object.entries(pool).filter(([id]) =>
      tagLists.some((tags) => id in filterByTags(pool, tags)),
    ),
  );

afterEach(() => {
  jest.restoreAllMocks();
  for (const key of Object.keys(mockExtraTemplates))
    delete mockExtraTemplates[key];
  for (const key of Object.keys(mockExtraCatalog)) delete mockExtraCatalog[key];
});

describe("resolveTemplate: block defaults", () => {
  const gks = () => planOf("GKS", true).blocks[0];

  it("resolves the GKS rest from the template override and the catalog", () => {
    expect(gks().rest).toEqual({
      withinSuperset: 45,
      betweenSets: 45,
      afterExercise: 45,
    });
  });

  it("resolves GKS sets, superset, countBy and fallback from the catalog", () => {
    expect(gks()).toMatchObject({
      skill: "GKS",
      sets: 2,
      superset: "none",
      countBy: "entries",
      fallbackToWholeTree: true,
    });
  });

  it("keeps the catalog withinSuperset and betweenSets when a block overrides afterExercise", () => {
    addTemplate("SYN_REST", [
      picksBlock({ skill: "GKS", rest: { afterExercise: 7 } }),
    ]);
    expect(planOf("SYN_REST").blocks[0].rest).toEqual({
      withinSuperset: 45,
      betweenSets: 90,
      afterExercise: 7,
    });
  });

  it("resolves the withWeights picks with weights", () => {
    expect(gks().picks).toEqual([{ tags: [], count: 4 }]);
  });

  it("resolves the withoutWeights picks without weights", () => {
    expect(planOf("GKS", false).blocks[0].picks).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 3 },
      { tags: ["REGION_FULL_BODY"], count: 2 },
    ]);
  });

  it.each(PLACES)(
    "resolves list form picks the same $label",
    ({ hasWeights }) => {
      expect(planOf("STABILITY", hasWeights).blocks[0].picks).toEqual([
        { tags: [], count: 6 },
      ]);
    },
  );

  it("resolves the WU set duration, rest and superset", () => {
    expect(planOf("WU").blocks[0]).toMatchObject({
      setDuration: 60,
      superset: "none",
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    });
  });

  it("resolves the PREVKNEE prevention block", () => {
    expect(planOf("PREVKNEE").blocks[1]).toMatchObject({
      skill: "PREVKNEE",
      superset: "drawOrderWithLeftovers",
      countBy: "pairs",
      sets: 2,
      rest: { withinSuperset: 30, betweenSets: 60, afterExercise: 60 },
    });
  });
});

describe("resolveTemplate: block pool", () => {
  it("reads tree GKS for STABILITY without weights", () => {
    expect(Object.keys(planOf("STABILITY").blocks[0].pool)).toEqual(
      Object.keys(readLiteralSkillTree(trees, "GKS")),
    );
  });

  it("reads tree GKSKG for GKS without weights", () => {
    expect(Object.keys(planOf("GKS").blocks[0].pool)).toEqual(
      Object.keys(readLiteralSkillTree(trees, "GKSKG")),
    );
  });

  it("throws SKILL_TREE for a missing tree", () => {
    expect(thrown(() => planOf("STABILITY", false, {}))).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["STABILITY"],
    });
  });

  it("drops branches without levels", () => {
    const from = { GKS: { ...tree({ a: [] }), b: { tags: [], levels: {} } } };
    expect(
      Object.keys(planOf("STABILITY", false, from).blocks[0].pool),
    ).toEqual(["a"]);
  });

  describe("with synthetic trees", () => {
    const from = {
      WU: tree({ 1: ["T_A"], 2: ["T_B"], 3: ["T_C"], 4: ["T_A", "T_B"] }),
    };
    const picks = [
      { tags: ["T_A"], count: 1 },
      { tags: ["T_C"], count: 1 },
    ];

    it("keeps only branches matching a pick without fallback", () => {
      addTemplate("SYN_POOL", [
        picksBlock({ picks, fallbackToWholeTree: false }),
      ]);
      expect(
        Object.keys(planOf("SYN_POOL", false, from).blocks[0].pool),
      ).toEqual(["1", "3", "4"]);
    });

    it("keeps the whole tree with fallback", () => {
      addTemplate("SYN_POOL", [
        picksBlock({ picks, fallbackToWholeTree: true }),
      ]);
      expect(
        Object.keys(planOf("SYN_POOL", false, from).blocks[0].pool),
      ).toEqual(["1", "2", "3", "4"]);
    });
  });

  describe.each(PLACES)("WUSPEZIAL $label", ({ hasWeights }) => {
    const narrowedBy = (prevention: string, id: string): SkillTreeType => {
      const block = planOf(id, hasWeights).blocks[0];
      const today = getSkillTree(trees, "WUSPEZIAL", [prevention], hasWeights);
      return pickMatches(
        today,
        block.picks.map((pick) => pick.tags),
      );
    };

    it("equals today's tree narrowed to the PREVKNEE pain regions and the picks", () => {
      const pool = planOf("PREVKNEE", hasWeights).blocks[0].pool;
      expect(Object.keys(pool)).toEqual(
        Object.keys(narrowedBy("PREVKNEE", "PREVKNEE")),
      );
    });

    it("keeps only branches with a knee or hip pain tag for PREVKNEE", () => {
      const pool = planOf("PREVKNEE", hasWeights).blocks[0].pool;
      const entries = Object.values(pool);
      // a branch can carry further pain tags next to its knee or hip tag
      expect(
        entries.length > 0 &&
          entries.every((entry) =>
            getTagValues(entry.tags, TagGroups.PAIN).some((r) =>
              ["KNEE", "HIP", "KNEE_HIP"].includes(r),
            ),
          ),
      ).toBe(true);
    });

    it("equals today's WUSPEZIAL tree for PREV", () => {
      const pool = planOf("PREV", hasWeights).blocks[0].pool;
      expect(Object.keys(pool)).toEqual(
        Object.keys(narrowedBy("PREV", "PREV")),
      );
    });
  });

  it("builds the plan pool from the merged block pools", () => {
    const plan = planOf("PREVKNEE", true);
    const merged = Object.assign({}, ...plan.blocks.map((block) => block.pool));
    expect(Object.keys(plan.pool)).toEqual(Object.keys(merged));
  });
});

describe("resolveTemplate: errors", () => {
  it("throws SKILL_TREE for an unknown template", () => {
    expect(thrown(() => planOf("NOPE"))).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["NOPE"],
    });
  });

  it("throws SKILL_TREE for an unknown block skill", () => {
    addTemplate("SYN_SKILL", [picksBlock({ skill: "NOSKILL" })]);
    expect(thrown(() => planOf("SYN_SKILL"))).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["NOSKILL"],
    });
  });

  it.each<[string, Block]>([
    ["duration", { kind: "duration", skill: "WU", duration: 30 }],
    ["branches", { kind: "branches", skill: "WU", branches: ["1"] }],
  ])("throws BLOCK_KIND for a %s block", (kind, block) => {
    addTemplate("SYN_KIND", [picksBlock(), block]);
    expect(thrown(() => planOf("SYN_KIND"))).toEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["SYN_KIND.blocks[1]", kind],
    });
  });

  it.each<[string, Partial<PicksBlock>]>([
    ["bodyParts", { bodyParts: { regions: ["core"] } }],
    ["order", { order: "asDrawn" }],
  ])("throws BLOCK_KIND for the unsupported field %s", (field, change) => {
    addTemplate("SYN_FIELD", [picksBlock(change)]);
    expect(thrown(() => planOf("SYN_FIELD"))).toEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["SYN_FIELD.blocks[0]", field],
    });
  });

  it("throws with the block path when neither block nor catalog sets sets", () => {
    mockExtraCatalog.NOSETS = {
      skillTree: { withWeights: ["WU"], withoutWeights: ["WU"] },
      countBy: "entries",
      fallbackToWholeTree: false,
      superset: "none",
      rest: { withinSuperset: 1, betweenSets: 1, afterExercise: 1 },
    };
    addTemplate("SYN_DEFAULT", [picksBlock(), picksBlock({ skill: "NOSETS" })]);
    expect(thrown(() => planOf("SYN_DEFAULT"))).toEqual(
      new Error("SYN_DEFAULT.blocks[1].sets: skill NOSETS sets no default"),
    );
  });

  it("throws with the path when the catalog sets no rest.betweenSets", () => {
    mockExtraCatalog.NOBETWEEN = {
      ...fullEntry,
      rest: {
        withinSuperset: 1,
        afterExercise: 1,
      } as SkillCatalogEntry["rest"],
    };
    addTemplate("SYN_REST_DEFAULT", [picksBlock({ skill: "NOBETWEEN" })]);
    expect(thrown(() => planOf("SYN_REST_DEFAULT"))).toEqual(
      new Error(
        "SYN_REST_DEFAULT.blocks[0].rest.betweenSets: skill NOBETWEEN sets no default",
      ),
    );
  });

  it("throws with the path when neither block nor catalog sets countBy", () => {
    mockExtraCatalog.NOCOUNTBY = { ...fullEntry, countBy: undefined };
    addTemplate("SYN_COUNT_DEFAULT", [picksBlock({ skill: "NOCOUNTBY" })]);
    expect(thrown(() => planOf("SYN_COUNT_DEFAULT"))).toEqual(
      new Error(
        "SYN_COUNT_DEFAULT.blocks[0].countBy: skill NOCOUNTBY sets no default",
      ),
    );
  });

  it("throws SKILL_TREE when the catalog names a tree that does not exist", () => {
    mockExtraCatalog.NOTREE = {
      ...fullEntry,
      skillTree: { withWeights: ["MISSING"], withoutWeights: ["MISSING"] },
    };
    addTemplate("SYN_NOTREE", [picksBlock({ skill: "NOTREE" })]);
    expect(thrown(() => planOf("SYN_NOTREE"))).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["NOTREE"],
    });
  });

  it("throws SKILL_TREE when the picks match no branch", () => {
    addTemplate("SYN_NOMATCH", [
      picksBlock({
        picks: [{ tags: ["T_NONE"], count: 1 }],
        fallbackToWholeTree: false,
      }),
    ]);
    const from = { WU: tree({ 1: ["T_A"] }) };
    expect(thrown(() => planOf("SYN_NOMATCH", false, from))).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["WU"],
    });
  });
});

describe("resolveTemplate: block overrides", () => {
  it("overrides the catalog countBy, superset, sets and fallback per block", () => {
    mockExtraCatalog.BASEENTRY = fullEntry;
    addTemplate("SYN_OVERRIDE", [
      picksBlock({
        skill: "BASEENTRY",
        countBy: "pairs",
        superset: "drawOrder",
        sets: 5,
        fallbackToWholeTree: true,
      }),
    ]);
    expect(planOf("SYN_OVERRIDE").blocks[0]).toMatchObject({
      countBy: "pairs",
      superset: "drawOrder",
      sets: 5,
      fallbackToWholeTree: true,
    });
  });

  it("keeps the catalog values without a block override", () => {
    mockExtraCatalog.BASEENTRY = fullEntry;
    addTemplate("SYN_BASE", [picksBlock({ skill: "BASEENTRY" })]);
    expect(planOf("SYN_BASE").blocks[0]).toMatchObject({
      countBy: "entries",
      superset: "none",
      sets: 2,
      fallbackToWholeTree: false,
    });
  });

  it("passes afterBlock into the block timing and keeps it out of the rest", () => {
    mockExtraCatalog.BASEENTRY = fullEntry;
    addTemplate("SYN_AFTER_BLOCK", [
      picksBlock({ skill: "BASEENTRY", rest: { afterBlock: 30 } }),
    ]);
    const [block] = planOf("SYN_AFTER_BLOCK").blocks;
    expect(block.afterBlock).toBe(30);
    expect(block.rest).toEqual({
      withinSuperset: 1,
      betweenSets: 1,
      afterExercise: 1,
    });
  });

  it("passes an afterBlock of 0 through", () => {
    mockExtraCatalog.BASEENTRY = fullEntry;
    addTemplate("SYN_AFTER_BLOCK_ZERO", [
      picksBlock({ skill: "BASEENTRY", rest: { afterBlock: 0 } }),
    ]);
    expect(planOf("SYN_AFTER_BLOCK_ZERO").blocks[0].afterBlock).toBe(0);
  });

  it("leaves afterBlock undefined without a block value", () => {
    mockExtraCatalog.BASEENTRY = fullEntry;
    addTemplate("SYN_NO_AFTER_BLOCK", [picksBlock({ skill: "BASEENTRY" })]);
    expect(planOf("SYN_NO_AFTER_BLOCK").blocks[0].afterBlock).toBeUndefined();
  });
});

describe("resolveTemplate: determinism", () => {
  it("never calls Math.random", () => {
    const random = jest.spyOn(Math, "random");
    for (const id of TEMPLATE_IDS) {
      for (const { equipment } of PLACES)
        resolveShortWorkoutPlan(id, trees, equipment);
    }
    expect(random).not.toHaveBeenCalled();
  });
});

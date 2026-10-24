import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { loadTemplate } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { Block, PicksBlock } from "@/schemas/aiwl.schema";
import type {
  SkillCatalog,
  SkillTreeCatalogEntry,
} from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  resolvePicksBlocks,
  type ResolvedPicksBlocks,
} from "./picksBlockResolution";

const WEIGHTS = ["DUMBBELL"];

/**
 * Resolves a bundled template with the bundled skill catalog and skill trees.
 *
 * resolveBundledTemplate("GKS", ["DUMBBELL"]).blocks[0].sets → 2
 */
const resolveBundledTemplate = (
  id: string,
  equipment: string[] = [],
): ResolvedPicksBlocks => {
  const template = loadTemplate(id);
  if (!template) throw new Error(`Template ${id} missing`);
  return resolvePicksBlocks(
    template,
    { equipment, skillCatalog: loadSkillCatalog() },
    getAllSkillTrees(),
  );
};

/**
 * Builds a picks block of skill SYN with one pick of one exercise.
 *
 * generatePicksBlock({ sets: 5 })
 * → { kind: "picks", skill: "SYN", picks: [{ tags: [], count: 1 }], sets: 5 }
 */
const generatePicksBlock = (change: Partial<PicksBlock> = {}): PicksBlock => ({
  kind: "picks",
  skill: "SYN",
  picks: [{ tags: [], count: 1 }],
  ...change,
});

/**
 * Builds a skill catalog entry that sets every default, reading tree T_W with
 * weights and tree T_A without.
 *
 * generateTreeCatalogEntry({ sets: 4 })
 * → { skillTree: { withWeights: ["T_W"], withoutWeights: ["T_A"] }, countBy: "entries",
 *     fallbackToWholeTree: false, superset: "none", sets: 4,
 *     rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 } }
 */
const generateTreeCatalogEntry = (
  change: Partial<SkillTreeCatalogEntry> = {},
): SkillTreeCatalogEntry => ({
  skillTree: { withWeights: ["T_W"], withoutWeights: ["T_A"] },
  countBy: "entries",
  fallbackToWholeTree: false,
  superset: "none",
  sets: 2,
  rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 },
  ...change,
});

/**
 * Builds a skill tree whose branches carry the given tags and one level each.
 *
 * generateTree({ 1: ["T_A"] }) → { 1: { tags: ["T_A"], levels: { 1: { exerciseId: "1" } } } }
 */
const generateTree = (tagsById: Record<string, string[]>): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tagsById).map(([id, tags]) => [
      id,
      { tags, levels: { 1: { exerciseId: "1" } } },
    ]),
  );

/**
 * Resolves template SYN of the given blocks against the given catalog and
 * trees. The catalog defaults to SYN reading tree T_A, which holds branch 1.
 *
 * resolveCustomTemplate([generatePicksBlock()]).blocks[0].pool → { 1: { tags: [], ... } }
 */
const resolveCustomTemplate = (
  blocks: Block[],
  {
    skillCatalog = { SYN: generateTreeCatalogEntry() },
    skillTrees = { T_A: generateTree({ 1: [] }) },
    equipment = [],
  }: {
    skillCatalog?: SkillCatalog;
    skillTrees?: Record<string, SkillTreeType>;
    equipment?: string[];
  } = {},
): ResolvedPicksBlocks =>
  resolvePicksBlocks(
    { aiwl: 1, id: "SYN", name: { en: "SYN" }, blocks },
    { equipment, skillCatalog },
    skillTrees,
  );

/** Returns the value the call throws, or undefined. */
const readThrownValue = (run: () => unknown): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe("picksBlockResolution: bundled templates", () => {
  it("resolves GKS with weights from the template and the catalog", () => {
    expect(resolveBundledTemplate("GKS", WEIGHTS).blocks[0]).toMatchObject({
      skill: "GKS",
      sets: 2,
      superset: "none",
      countBy: "entries",
      fallbackToWholeTree: true,
      rest: { withinSuperset: 45, betweenSets: 45, afterExercise: 45 },
      picks: [{ tags: [], count: 4 }],
    });
  });

  it("resolves the withoutWeights picks without weights", () => {
    expect(resolveBundledTemplate("GKS").blocks[0].picks).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 3 },
      { tags: ["REGION_FULL_BODY"], count: 2 },
    ]);
  });

  it("resolves the PREVKNEE prevention block", () => {
    expect(resolveBundledTemplate("PREVKNEE").blocks[1]).toMatchObject({
      skill: "PREVKNEE",
      superset: "drawOrderWithLeftovers",
      countBy: "pairs",
      sets: 2,
      rest: { withinSuperset: 30, betweenSets: 60, afterExercise: 60 },
    });
  });
});

describe("picksBlockResolution: block values", () => {
  it("reads the defaults from the given skill catalog", () => {
    expect(resolveCustomTemplate([generatePicksBlock()]).blocks[0]).toEqual({
      skill: "SYN",
      pool: generateTree({ 1: [] }),
      picks: [{ tags: [], count: 1 }],
      countBy: "entries",
      fallbackToWholeTree: false,
      sets: 2,
      superset: "none",
      rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 },
    });
  });

  it("takes the block's own values before the catalog's", () => {
    const block = generatePicksBlock({
      countBy: "pairs",
      superset: "drawOrder",
      sets: 5,
      fallbackToWholeTree: true,
      setDuration: 20,
      values: "exercise",
      rest: { afterBlock: 0 },
    });

    expect(resolveCustomTemplate([block]).blocks[0]).toMatchObject({
      countBy: "pairs",
      superset: "drawOrder",
      sets: 5,
      fallbackToWholeTree: true,
      setDuration: 20,
      values: "exercise",
      rest: {
        withinSuperset: 1,
        betweenSets: 2,
        afterExercise: 3,
        afterBlock: 0,
      },
    });
  });
});

describe("picksBlockResolution: block pool", () => {
  it.each<{ behaviour: string; equipment: string[]; pool: string[] }>([
    {
      behaviour: "reads the trees with weights",
      equipment: WEIGHTS,
      pool: ["9"],
    },
    {
      behaviour: "reads every tree without weights",
      equipment: [],
      pool: ["1", "2"],
    },
  ])("$behaviour", ({ equipment, pool }) => {
    const entry = generateTreeCatalogEntry({
      skillTree: { withWeights: ["T_W"], withoutWeights: ["T_B", "T_A"] },
    });
    const { blocks } = resolveCustomTemplate([generatePicksBlock()], {
      skillCatalog: { SYN: entry },
      skillTrees: {
        T_A: generateTree({ 1: [] }),
        T_B: generateTree({ 2: [] }),
        T_W: generateTree({ 9: [] }),
      },
      equipment,
    });

    expect(Object.keys(blocks[0].pool)).toEqual(pool);
  });

  it("drops branches without levels", () => {
    const skillTrees = {
      T_A: { ...generateTree({ 1: [] }), 2: { tags: [], levels: {} } },
    };

    const { blocks } = resolveCustomTemplate([generatePicksBlock()], {
      skillTrees,
    });

    expect(Object.keys(blocks[0].pool)).toEqual(["1"]);
  });

  it.each<{ fallbackToWholeTree: boolean; pool: string[] }>([
    { fallbackToWholeTree: false, pool: ["1", "3", "4"] },
    { fallbackToWholeTree: true, pool: ["1", "2", "3", "4"] },
  ])(
    "keeps the branches a pick matches unless it falls back to the whole tree: $fallbackToWholeTree",
    ({ fallbackToWholeTree, pool }) => {
      const block = generatePicksBlock({
        fallbackToWholeTree,
        picks: [
          { tags: ["T_A"], count: 1 },
          { tags: ["T_C"], count: 1 },
        ],
      });
      const skillTrees = {
        T_A: generateTree({
          1: ["T_A"],
          2: ["T_B"],
          3: ["T_C"],
          4: ["T_A", "T_B"],
        }),
      };

      const { blocks } = resolveCustomTemplate([block], { skillTrees });

      expect(Object.keys(blocks[0].pool)).toEqual(pool);
    },
  );

  it("builds the workout pool from the block pools in block order", () => {
    const skillCatalog = {
      SYN: generateTreeCatalogEntry(),
      OTHER: generateTreeCatalogEntry({
        skillTree: { withWeights: ["T_W"], withoutWeights: ["T_B"] },
      }),
    };
    const skillTrees = {
      T_A: generateTree({ a: [] }),
      T_B: generateTree({ b: [] }),
    };

    const { pool } = resolveCustomTemplate(
      [generatePicksBlock({ skill: "OTHER" }), generatePicksBlock()],
      { skillCatalog, skillTrees },
    );

    expect(Object.keys(pool)).toEqual(["b", "a"]);
  });
});

describe("picksBlockResolution: special warm-up pool", () => {
  // WU_X reads the special warm-up tree; PREV_X is a prevention skill for the knee.
  const skillCatalog: SkillCatalog = {
    WU_X: generateTreeCatalogEntry({
      skillTree: { withWeights: ["WUSPEZIAL"], withoutWeights: ["WUSPEZIAL"] },
    }),
    PREV_X: generateTreeCatalogEntry({
      focusArea: "PREVENTION",
      painRegions: ["KNEE"],
    }),
    OTHER_X: generateTreeCatalogEntry({ painRegions: ["KNEE"] }),
  };

  it.each<{
    behaviour: string;
    skills: string[];
    tree: SkillTreeType;
    pool: string[];
  }>([
    {
      behaviour: "narrows to the pain regions of the prevention blocks",
      skills: ["WU_X", "PREV_X"],
      tree: generateTree({ 1: ["PAIN_KNEE"], 2: ["PAIN_SHOULDER"], 3: [] }),
      pool: ["1"],
    },
    {
      behaviour: "keeps the whole tree without a prevention block",
      skills: ["WU_X", "OTHER_X"],
      tree: generateTree({ 1: ["PAIN_KNEE"], 2: ["PAIN_SHOULDER"] }),
      pool: ["1", "2"],
    },
    {
      behaviour: "keeps the whole tree when no branch has a prevention region",
      skills: ["WU_X", "PREV_X"],
      tree: generateTree({ 2: ["PAIN_SHOULDER"], 3: [] }),
      pool: ["2", "3"],
    },
  ])("$behaviour", ({ skills, tree, pool }) => {
    const { blocks } = resolveCustomTemplate(
      skills.map((skill) => generatePicksBlock({ skill })),
      {
        skillCatalog,
        skillTrees: { WUSPEZIAL: tree, T_A: generateTree({ 9: [] }) },
      },
    );

    expect(Object.keys(blocks[0].pool)).toEqual(pool);
  });

  it("drops the only matching branch without levels and throws SKILL_TREE", () => {
    const tree = {
      ...generateTree({ 2: ["PAIN_SHOULDER"] }),
      1: { tags: ["PAIN_KNEE"], levels: {} },
    };

    expect(
      readThrownValue(() =>
        resolveCustomTemplate(
          [
            generatePicksBlock({ skill: "WU_X" }),
            generatePicksBlock({ skill: "PREV_X" }),
          ],
          {
            skillCatalog,
            skillTrees: { WUSPEZIAL: tree, T_A: generateTree({ 9: [] }) },
          },
        ),
      ),
    ).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["WU_X"],
    });
  });
});

describe("picksBlockResolution: errors", () => {
  it.each<{ behaviour: string; blocks: Block[]; params: string[] }>([
    {
      behaviour: "a duration block, before any block resolves",
      blocks: [
        generatePicksBlock({ skill: "UNKNOWN" }),
        { kind: "duration", skill: "SYN", duration: 30 },
      ],
      params: ["SYN.blocks[1]", "duration"],
    },
    {
      behaviour: "a branches block",
      blocks: [{ kind: "branches", skill: "SYN", branches: ["1"] }],
      params: ["SYN.blocks[0]", "branches"],
    },
    {
      behaviour: "the unsupported field bodyParts",
      blocks: [generatePicksBlock({ bodyParts: { regions: ["core"] } })],
      params: ["SYN.blocks[0]", "bodyParts"],
    },
    {
      behaviour: "the unsupported field order",
      blocks: [generatePicksBlock({ order: "asDrawn" })],
      params: ["SYN.blocks[0]", "order"],
    },
  ])("throws BLOCK_KIND for $behaviour", ({ blocks, params }) => {
    expect(readThrownValue(() => resolveCustomTemplate(blocks))).toEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params,
    });
  });

  it.each<{
    behaviour: string;
    skill: string;
    skillCatalog: SkillCatalog;
    picks?: PicksBlock["picks"];
  }>([
    {
      behaviour: "a skill missing from the catalog",
      skill: "SYN",
      skillCatalog: {},
    },
    {
      behaviour: "the inherited key constructor",
      skill: "constructor",
      skillCatalog: { SYN: generateTreeCatalogEntry() },
    },
    {
      behaviour: "a timing-only skill",
      skill: "SYN",
      skillCatalog: { SYN: { sets: 2, superset: "none" } },
    },
    {
      behaviour: "a tree name without a tree",
      skill: "SYN",
      skillCatalog: {
        SYN: generateTreeCatalogEntry({
          skillTree: { withWeights: ["MISSING"], withoutWeights: ["MISSING"] },
        }),
      },
    },
    {
      behaviour: "picks that match no branch",
      skill: "SYN",
      skillCatalog: { SYN: generateTreeCatalogEntry() },
      picks: [{ tags: ["T_NONE"], count: 1 }],
    },
  ])(
    "throws SKILL_TREE for $behaviour",
    ({ skill, skillCatalog, picks = [{ tags: [], count: 1 }] }) => {
      expect(
        readThrownValue(() =>
          resolveCustomTemplate([generatePicksBlock({ skill, picks })], {
            skillCatalog,
            skillTrees: { T_A: generateTree({ 1: ["T_A"] }) },
          }),
        ),
      ).toEqual({
        type: "NO_EXERCISES",
        subtype: "SKILL_TREE",
        params: [skill],
      });
    },
  );

  it.each<{ behaviour: string; entry: SkillTreeCatalogEntry; message: string }>(
    [
      {
        behaviour: "countBy",
        entry: generateTreeCatalogEntry({ countBy: undefined }),
        message: "SYN.blocks[1].countBy: skill SYN sets no default",
      },
      {
        behaviour: "sets before an empty pool",
        entry: generateTreeCatalogEntry({
          sets: undefined,
          skillTree: { withWeights: ["MISSING"], withoutWeights: ["MISSING"] },
        }),
        message: "SYN.blocks[1].sets: skill SYN sets no default",
      },
    ],
  )(
    "throws with the block path for a missing $behaviour",
    ({ entry, message }) => {
      const skillCatalog = { SYN: entry, FIRST: generateTreeCatalogEntry() };

      expect(
        readThrownValue(() =>
          resolveCustomTemplate(
            [generatePicksBlock({ skill: "FIRST" }), generatePicksBlock()],
            { skillCatalog },
          ),
        ),
      ).toEqual(new Error(message));
    },
  );
});

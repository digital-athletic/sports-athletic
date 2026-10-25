import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { loadTemplate } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { Block } from "@/schemas/aiwl.schema";
import type {
  SkillCatalog,
  SkillTreeCatalogEntry,
} from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  generateSpecialWarmUpCatalog,
  generateTreeCatalogEntry,
} from "@test/factories/skillCatalog";
import { generateTaggedBranches } from "@test/factories/skillTree";
import {
  generateSelectionsBlock,
  generateTemplate,
  generateUntimedBranchesBlock,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import {
  resolveSelectionsBlocks,
  type ResolvedSelectionsBlocks,
} from "./selectionsBlockResolution";

type SelectionsBlock = Extract<Block, { kind: "picks" }>;

const WEIGHTS = ["DUMBBELL"];

/**
 * Resolves a bundled template with the bundled skill catalog and skill trees.
 *
 * resolveBundledTemplate("GKS", ["DUMBBELL"]).blocks[0].sets → 2
 */
const resolveBundledTemplate = (
  id: string,
  equipment: string[] = [],
): ResolvedSelectionsBlocks => {
  const template = loadTemplate(id);
  if (!template) throw new Error(`Template ${id} missing`);
  return resolveSelectionsBlocks(
    template,
    { equipment, skillCatalog: loadSkillCatalog() },
    getAllSkillTrees(),
  );
};

/**
 * Resolves template SYN of the given blocks against the given catalog and
 * trees. The catalog defaults to SYN reading tree T_A, which holds branch 1.
 *
 * resolveCustomTemplate([generateSelectionsBlock("SYN")]).blocks[0].pool → { 1: { tags: [], ... } }
 */
const resolveCustomTemplate = (
  blocks: Block[],
  {
    skillCatalog = { SYN: generateTreeCatalogEntry() },
    skillTrees = { T_A: generateTaggedBranches({ 1: [] }) },
    equipment = [],
  }: {
    skillCatalog?: SkillCatalog;
    skillTrees?: Record<string, SkillTreeType>;
    equipment?: string[];
  } = {},
): ResolvedSelectionsBlocks =>
  resolveSelectionsBlocks(
    generateTemplate(blocks, { id: "SYN", name: { en: "SYN" } }),
    { equipment, skillCatalog },
    skillTrees,
  );

describe("selectionsBlockResolution: bundled templates", () => {
  it("resolves GKS with weights from the template and the catalog", () => {
    expect(resolveBundledTemplate("GKS", WEIGHTS).blocks[0]).toMatchObject({
      skill: "GKS",
      sets: 2,
      superset: "none",
      countBy: "entries",
      fallbackToWholeTree: true,
      rest: { withinSuperset: 45, betweenSets: 45, afterExercise: 45 },
      selections: [{ tags: [], count: 4 }],
    });
  });

  it("resolves the withoutWeights selections without weights", () => {
    expect(resolveBundledTemplate("GKS").blocks[0].selections).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 3 },
      { tags: ["REGION_FULL_BODY"], count: 2 },
    ]);
  });
});

describe("selectionsBlockResolution: block values", () => {
  it("reads the defaults from the given skill catalog", () => {
    expect(
      resolveCustomTemplate([generateSelectionsBlock("SYN")]).blocks[0],
    ).toEqual({
      skill: "SYN",
      pool: generateTaggedBranches({ 1: [] }),
      selections: [{ tags: [], count: 1 }],
      countBy: "entries",
      fallbackToWholeTree: false,
      sets: 2,
      superset: "none",
      rest: { withinSuperset: 1, betweenSets: 2, afterExercise: 3 },
    });
  });

  it("takes the block's own values before the catalog's", () => {
    const block = generateSelectionsBlock("SYN", {
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

describe("selectionsBlockResolution: block pool", () => {
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
    const { blocks } = resolveCustomTemplate([generateSelectionsBlock("SYN")], {
      skillCatalog: { SYN: entry },
      skillTrees: {
        T_A: generateTaggedBranches({ 1: [] }),
        T_B: generateTaggedBranches({ 2: [] }),
        T_W: generateTaggedBranches({ 9: [] }),
      },
      equipment,
    });

    expect(Object.keys(blocks[0].pool)).toEqual(pool);
  });

  it("drops branches without levels", () => {
    const skillTrees = {
      T_A: {
        ...generateTaggedBranches({ 1: [] }),
        ...generateTaggedBranches({ 2: [] }, {}),
      },
    };

    const { blocks } = resolveCustomTemplate([generateSelectionsBlock("SYN")], {
      skillTrees,
    });

    expect(Object.keys(blocks[0].pool)).toEqual(["1"]);
  });

  it.each<{ fallbackToWholeTree: boolean; pool: string[] }>([
    { fallbackToWholeTree: false, pool: ["1", "3", "4"] },
    { fallbackToWholeTree: true, pool: ["1", "2", "3", "4"] },
  ])(
    "keeps the branches a selection matches unless it falls back to the whole tree: $fallbackToWholeTree",
    ({ fallbackToWholeTree, pool }) => {
      const block = generateSelectionsBlock("SYN", {
        fallbackToWholeTree,
        picks: [
          { tags: ["T_A"], count: 1 },
          { tags: ["T_C"], count: 1 },
        ],
      });
      const skillTrees = {
        T_A: generateTaggedBranches({
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
      T_A: generateTaggedBranches({ a: [] }),
      T_B: generateTaggedBranches({ b: [] }),
    };

    const { pool } = resolveCustomTemplate(
      [generateSelectionsBlock("OTHER"), generateSelectionsBlock("SYN")],
      { skillCatalog, skillTrees },
    );

    expect(Object.keys(pool)).toEqual(["b", "a"]);
  });
});

describe("selectionsBlockResolution: special warm-up pool", () => {
  it.each<{
    behaviour: string;
    skills: string[];
    tree: SkillTreeType;
    pool: string[];
  }>([
    {
      behaviour: "narrows to the pain regions of the prevention blocks",
      skills: ["WU_X", "PREV_X"],
      tree: generateTaggedBranches({
        1: ["PAIN_KNEE"],
        2: ["PAIN_SHOULDER"],
        3: [],
      }),
      pool: ["1"],
    },
    {
      behaviour: "keeps the whole tree without a prevention block",
      skills: ["WU_X", "OTHER_X"],
      tree: generateTaggedBranches({ 1: ["PAIN_KNEE"], 2: ["PAIN_SHOULDER"] }),
      pool: ["1", "2"],
    },
    {
      behaviour: "keeps the whole tree when no branch has a prevention region",
      skills: ["WU_X", "PREV_X"],
      tree: generateTaggedBranches({ 2: ["PAIN_SHOULDER"], 3: [] }),
      pool: ["2", "3"],
    },
  ])("$behaviour", ({ skills, tree, pool }) => {
    const { blocks } = resolveCustomTemplate(
      skills.map((skill) => generateSelectionsBlock(skill)),
      {
        skillCatalog: generateSpecialWarmUpCatalog(),
        skillTrees: { WUSPEZIAL: tree, T_A: generateTaggedBranches({ 9: [] }) },
      },
    );

    expect(Object.keys(blocks[0].pool)).toEqual(pool);
  });

  it("drops the only matching branch without levels and throws SKILL_TREE", () => {
    const tree = {
      ...generateTaggedBranches({ 2: ["PAIN_SHOULDER"] }),
      ...generateTaggedBranches({ 1: ["PAIN_KNEE"] }, {}),
    };

    expect(
      catchThrownValue(() =>
        resolveCustomTemplate(
          [generateSelectionsBlock("WU_X"), generateSelectionsBlock("PREV_X")],
          {
            skillCatalog: generateSpecialWarmUpCatalog(),
            skillTrees: {
              WUSPEZIAL: tree,
              T_A: generateTaggedBranches({ 9: [] }),
            },
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

describe("selectionsBlockResolution: errors", () => {
  it.each<{ behaviour: string; blocks: Block[]; params: string[] }>([
    {
      behaviour: "a minutes block, before any block resolves",
      blocks: [
        generateSelectionsBlock("UNKNOWN"),
        { kind: "duration", skill: "SYN", duration: 30 },
      ],
      params: ["SYN.blocks[1]", "duration"],
    },
    {
      behaviour: "a branches block",
      blocks: [generateUntimedBranchesBlock("SYN")],
      params: ["SYN.blocks[0]", "branches"],
    },
    {
      behaviour: "the unsupported field bodyParts",
      blocks: [
        generateSelectionsBlock("SYN", { bodyParts: { regions: ["core"] } }),
      ],
      params: ["SYN.blocks[0]", "bodyParts"],
    },
    {
      behaviour: "the unsupported field order",
      blocks: [generateSelectionsBlock("SYN", { order: "asDrawn" })],
      params: ["SYN.blocks[0]", "order"],
    },
  ])("throws BLOCK_KIND for $behaviour", ({ blocks, params }) => {
    expect(catchThrownValue(() => resolveCustomTemplate(blocks))).toEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params,
    });
  });

  it.each<{
    behaviour: string;
    skill: string;
    skillCatalog: SkillCatalog;
    selections?: SelectionsBlock["picks"];
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
      behaviour: "a skill with timing values only",
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
      behaviour: "selections that match no branch",
      skill: "SYN",
      skillCatalog: { SYN: generateTreeCatalogEntry() },
      selections: [{ tags: ["T_NONE"], count: 1 }],
    },
  ])(
    "throws SKILL_TREE for $behaviour",
    ({ skill, skillCatalog, selections = [{ tags: [], count: 1 }] }) => {
      expect(
        catchThrownValue(() =>
          resolveCustomTemplate(
            [generateSelectionsBlock(skill, { picks: selections })],
            {
              skillCatalog,
              skillTrees: { T_A: generateTaggedBranches({ 1: ["T_A"] }) },
            },
          ),
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
        catchThrownValue(() =>
          resolveCustomTemplate(
            [generateSelectionsBlock("FIRST"), generateSelectionsBlock("SYN")],
            { skillCatalog },
          ),
        ),
      ).toEqual(new Error(message));
    },
  );
});

import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { type BranchDraw, createBranchDraw } from "./branchDraw";
import { drawPicksBlock, type PicksBlockDraw } from "./picksDraw";

/**
 * Builds branches with the given tags and one level each, whose exercise ID
 * equals the branch ID.
 *
 * generateBranches({ a: ["SIDE_ONE"] })
 * → { a: { tags: ["SIDE_ONE"], levels: { 1: { exerciseId: "a" } } } }
 */
const generateBranches = (tagsById: Record<string, string[]>): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tagsById).map(([id, tags]) => [
      id,
      { tags, levels: { 1: { exerciseId: id } } },
    ]),
  );

/**
 * References a branch by its ID, which also serves as its exercise ID.
 *
 * generateReference({ a: { tags: ["SIDE_ONE"], ... } }, "a")
 * → { branchId: "a", branchTags: ["SIDE_ONE"], exerciseId: "a" }
 */
const generateReference = (
  branches: SkillTreeType,
  id: string,
): BranchExerciseReference => ({
  branchId: id,
  branchTags: branches[id].tags,
  exerciseId: id,
});

// Draws the first unused branches, so the key order of the branches decides.
const FIRST_UNUSED_BRANCH_DRAW: BranchDraw = {
  single: (branches, usedBranchIds) => {
    const id = Object.keys(branches).find(
      (key) => !usedBranchIds.includes(key),
    );
    return id ? generateReference(branches, id) : null;
  },
  pair: (branches, usedBranchIds) => {
    const [id, partnerId] = Object.keys(branches).filter(
      (key) => !usedBranchIds.includes(key),
    );
    if (!id) return null;
    return {
      lead: generateReference(branches, id),
      partner: partnerId ? generateReference(branches, partnerId) : undefined,
    };
  },
};

/**
 * Draws one picks block with the first unused branch draw and returns the
 * drawn branch IDs and the IDs the block marked used.
 *
 * drawBlockWithFirstUnusedBranch({ picks: [{ tags: [], count: 2 }] }, generateBranches({ a: [], b: [], c: [] }))
 * → { drawn: ["a", "b"], used: ["a", "b"] }
 */
const drawBlockWithFirstUnusedBranch = (
  change: Partial<PicksBlockDraw>,
  pool: SkillTreeType,
  {
    blockPool = pool,
    usedBranchIds = [],
  }: { blockPool?: SkillTreeType; usedBranchIds?: string[] } = {},
): { drawn: string[]; used: string[] } => {
  const block: PicksBlockDraw = {
    pool: blockPool,
    picks: [{ tags: [], count: 1 }],
    countBy: "exercises",
    fallbackToWholeTree: false,
    ...change,
  };
  const result = drawPicksBlock(block, {
    pool,
    draw: FIRST_UNUSED_BRANCH_DRAW,
    usedBranchIds,
  });
  return {
    drawn: result.branches.map(({ branchId }) => branchId),
    used: result.usedBranchIds,
  };
};

describe("picksDraw: count by entries", () => {
  it.each<{
    behaviour: string;
    count: number;
    tags: Record<string, string[]>;
    drawn: string[];
  }>([
    {
      behaviour: "counts a two sided exercise as 1 entry",
      count: 2,
      tags: {
        pushUp: ["SIDE_BOTH"],
        squat: ["SIDE_BOTH"],
        burpee: ["SIDE_BOTH"],
      },
      drawn: ["pushUp", "squat"],
    },
    {
      behaviour: "counts a one sided exercise as 2 entries",
      count: 2,
      tags: { singleArmRow: ["SIDE_ONE"], pushUp: ["SIDE_BOTH"] },
      drawn: ["singleArmRow"],
    },
    {
      behaviour: "skips a one sided exercise when only 1 entry is missing",
      count: 2,
      tags: {
        pushUp: ["SIDE_BOTH"],
        singleArmRow: ["SIDE_ONE"],
        squat: ["SIDE_BOTH"],
      },
      drawn: ["pushUp", "squat"],
    },
  ])("$behaviour", ({ count, tags, drawn }) => {
    expect(
      drawBlockWithFirstUnusedBranch(
        { countBy: "entries", picks: [{ tags: [], count }] },
        generateBranches(tags),
      ).drawn,
    ).toEqual(drawn);
  });

  it("draws one pick after the other", () => {
    const pool = generateBranches({
      pushUp: ["REGION_UPPER_BODY"],
      burpee: ["REGION_FULL_BODY"],
      squat: ["REGION_LOWER_BODY"],
    });
    const picks = [
      { tags: ["REGION_FULL_BODY"], count: 1 },
      { tags: ["REGION_LOWER_BODY"], count: 1 },
    ];

    expect(
      drawBlockWithFirstUnusedBranch({ countBy: "entries", picks }, pool).drawn,
    ).toEqual(["burpee", "squat"]);
  });

  it.each<{ fallbackToWholeTree: boolean; drawn: string[] }>([
    { fallbackToWholeTree: true, drawn: ["squat", "pushUp"] },
    { fallbackToWholeTree: false, drawn: ["squat"] },
  ])(
    "fills up from the whole pool only with fallback: $fallbackToWholeTree",
    ({ fallbackToWholeTree, drawn }) => {
      const pool = generateBranches({
        squat: ["REGION_LOWER_BODY"],
        pushUp: ["REGION_UPPER_BODY"],
      });
      const picks = [{ tags: ["REGION_LOWER_BODY"], count: 2 }];

      expect(
        drawBlockWithFirstUnusedBranch(
          { countBy: "entries", picks, fallbackToWholeTree },
          pool,
        ).drawn,
      ).toEqual(drawn);
    },
  );
});

describe("picksDraw: count by exercises and pairs", () => {
  it("counts a one sided exercise once", () => {
    const pool = generateBranches({ a: ["SIDE_ONE"], b: ["SIDE_ONE"], c: [] });

    expect(
      drawBlockWithFirstUnusedBranch({ picks: [{ tags: [], count: 2 }] }, pool)
        .drawn,
    ).toEqual(["a", "b"]);
  });

  it("draws each pair with its partner and orders weighted pairs last", () => {
    const pool = generateBranches({
      a: ["EQ_TYPE_WEIGHTS"],
      b: [],
      c: [],
      d: [],
    });

    expect(
      drawBlockWithFirstUnusedBranch(
        { countBy: "pairs", picks: [{ tags: [], count: 2 }] },
        pool,
      ).drawn,
    ).toEqual(["c", "d", "a", "b"]);
  });

  it("stops when no pair is left", () => {
    expect(
      drawBlockWithFirstUnusedBranch(
        { countBy: "pairs", picks: [{ tags: [], count: 3 }] },
        generateBranches({ a: [] }),
      ).drawn,
    ).toEqual(["a"]);
  });
});

describe("picksDraw: with the branch draws", () => {
  it("skips an exercise an earlier pick drew and falls back to the block pool", () => {
    const pool: SkillTreeType = {
      a: { tags: ["REGION_LOWER_BODY"], levels: { 1: { exerciseId: "x" } } },
      b: { tags: ["REGION_LOWER_BODY"], levels: { 1: { exerciseId: "y" } } },
      c: { tags: ["REGION_UPPER_BODY"], levels: { 1: { exerciseId: "x" } } },
      d: { tags: ["REGION_UPPER_BODY"], levels: { 1: { exerciseId: "z" } } },
    };
    const random = generateSequenceRandom([0, 0, 0, 0.99]);
    const draw = createBranchDraw({
      pool,
      fitnessLevel: "ADVANCED",
      exerciseCatalog: [],
      exerciseData: { exerciseData: {}, branchData: {} },
      random,
    });
    const block: PicksBlockDraw = {
      pool,
      picks: [
        { tags: ["REGION_LOWER_BODY"], count: 1 },
        { tags: ["REGION_UPPER_BODY"], count: 2 },
      ],
      countBy: "exercises",
      fallbackToWholeTree: true,
    };

    const result = drawPicksBlock(block, { pool, draw, usedBranchIds: [] });

    // c shares exercise x with a, so the upper body pick falls back to b
    expect(result.branches.map(({ branchId }) => branchId)).toEqual([
      "a",
      "d",
      "b",
    ]);
    expect(result.usedBranchIds).toEqual(["a", "d", "b"]);
    expect(random()).toBe(0.99);
  });
});

describe("picksDraw: used branches", () => {
  it("never draws a branch the workout already uses and leaves the given list unchanged", () => {
    const usedBranchIds = ["a"];

    const result = drawBlockWithFirstUnusedBranch(
      { picks: [{ tags: [], count: 2 }] },
      generateBranches({ a: [], b: [] }),
      { usedBranchIds },
    );

    expect(result).toEqual({ drawn: ["b"], used: ["b"] });
    expect(usedBranchIds).toEqual(["a"]);
  });

  it.each<{
    behaviour: string;
    change: Partial<PicksBlockDraw>;
    tags: Record<string, string[]>;
    used: string[];
  }>([
    {
      behaviour: "both branches of a drawn pair",
      change: { countBy: "pairs", picks: [{ tags: [], count: 1 }] },
      tags: { a: [], b: [], c: [] },
      used: ["a", "b"],
    },
    {
      // the next pick of the workout must not draw the skipped branch again
      behaviour: "a one sided branch that overflowed the last entry",
      change: { countBy: "entries", picks: [{ tags: [], count: 2 }] },
      tags: { a: ["SIDE_BOTH"], b: ["SIDE_ONE"], c: ["SIDE_BOTH"] },
      used: ["a", "b", "c"],
    },
  ])("marks used $behaviour", ({ change, tags, used }) => {
    expect(
      drawBlockWithFirstUnusedBranch(change, generateBranches(tags)).used,
    ).toEqual(used);
  });
});

describe("picksDraw: block pool", () => {
  it.each<{
    behaviour: string;
    change: Partial<PicksBlockDraw>;
    pool: SkillTreeType;
    blockPool: SkillTreeType;
    drawn: string[];
  }>([
    {
      behaviour: "never draws a branch outside the block pool",
      change: { picks: [{ tags: [], count: 3 }], fallbackToWholeTree: true },
      pool: generateBranches({ a: [], b: [], c: [] }),
      blockPool: generateBranches({ b: [] }),
      drawn: ["b"],
    },
    {
      behaviour: "never falls back to a branch outside the block pool",
      change: {
        picks: [{ tags: ["SKILL_X"], count: 2 }],
        fallbackToWholeTree: true,
      },
      pool: generateBranches({ a: ["SKILL_X"], b: [], c: [] }),
      blockPool: generateBranches({ c: [] }),
      drawn: ["c"],
    },
    {
      behaviour: "keeps the key order of the workout pool",
      change: { picks: [{ tags: [], count: 2 }] },
      pool: generateBranches({ a: [], b: [], c: [] }),
      blockPool: generateBranches({ c: [], b: [], a: [] }),
      drawn: ["a", "b"],
    },
    {
      behaviour:
        "draws nothing when the block pool shares no branch with the workout pool",
      change: { picks: [{ tags: [], count: 2 }], fallbackToWholeTree: true },
      pool: generateBranches({ a: [], b: [] }),
      blockPool: generateBranches({ z: [] }),
      drawn: [],
    },
  ])("$behaviour", ({ change, pool, blockPool, drawn }) => {
    expect(
      drawBlockWithFirstUnusedBranch(change, pool, { blockPool }).drawn,
    ).toEqual(drawn);
  });
});

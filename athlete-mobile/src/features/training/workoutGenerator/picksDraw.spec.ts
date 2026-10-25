import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { generateReferenceFromBranch } from "@test/factories/branchReference";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import {
  generateSelfNamedBranches,
  generateTreeBranch,
} from "@test/factories/skillTree";
import { type BranchDraw, createBranchDraw } from "./branchDraw";
import { drawPicksBlock, type PicksBlockDraw } from "./picksDraw";

// Draws the first unused branches, so the key order of the branches decides.
const FIRST_UNUSED_BRANCH_DRAW: BranchDraw = {
  single: (branches, usedBranchIds) => {
    const id = Object.keys(branches).find(
      (key) => !usedBranchIds.includes(key),
    );
    return id ? generateReferenceFromBranch(branches, id) : null;
  },
  pair: (branches, usedBranchIds) => {
    const [id, partnerId] = Object.keys(branches).filter(
      (key) => !usedBranchIds.includes(key),
    );
    if (!id) return null;
    return {
      lead: generateReferenceFromBranch(branches, id),
      partner: partnerId
        ? generateReferenceFromBranch(branches, partnerId)
        : undefined,
    };
  },
};

/**
 * Draws one picks block with the first unused branch draw and returns the
 * drawn branch IDs and the IDs the block marked used.
 *
 * drawBlockWithFirstUnusedBranch({ picks: [{ tags: [], count: 2 }] }, generateSelfNamedBranches({ a: [], b: [], c: [] }))
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
        generateSelfNamedBranches(tags),
      ).drawn,
    ).toEqual(drawn);
  });

  it("draws one pick after the other", () => {
    const pool = generateSelfNamedBranches({
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
      const pool = generateSelfNamedBranches({
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
    const pool = generateSelfNamedBranches({
      a: ["SIDE_ONE"],
      b: ["SIDE_ONE"],
      c: [],
    });

    expect(
      drawBlockWithFirstUnusedBranch({ picks: [{ tags: [], count: 2 }] }, pool)
        .drawn,
    ).toEqual(["a", "b"]);
  });

  it("draws each pair with its partner and orders weighted pairs last", () => {
    const pool = generateSelfNamedBranches({
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
        generateSelfNamedBranches({ a: [] }),
      ).drawn,
    ).toEqual(["a"]);
  });
});

describe("picksDraw: with the branch draws", () => {
  it("skips an exercise an earlier pick drew and falls back to the block pool", () => {
    const pool: SkillTreeType = {
      a: generateTreeBranch(["x"], ["REGION_LOWER_BODY"]),
      b: generateTreeBranch(["y"], ["REGION_LOWER_BODY"]),
      c: generateTreeBranch(["x"], ["REGION_UPPER_BODY"]),
      d: generateTreeBranch(["z"], ["REGION_UPPER_BODY"]),
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
      generateSelfNamedBranches({ a: [], b: [] }),
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
      drawBlockWithFirstUnusedBranch(change, generateSelfNamedBranches(tags))
        .used,
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
      pool: generateSelfNamedBranches({ a: [], b: [], c: [] }),
      blockPool: generateSelfNamedBranches({ b: [] }),
      drawn: ["b"],
    },
    {
      behaviour: "never falls back to a branch outside the block pool",
      change: {
        picks: [{ tags: ["SKILL_X"], count: 2 }],
        fallbackToWholeTree: true,
      },
      pool: generateSelfNamedBranches({ a: ["SKILL_X"], b: [], c: [] }),
      blockPool: generateSelfNamedBranches({ c: [] }),
      drawn: ["c"],
    },
    {
      behaviour: "keeps the key order of the workout pool",
      change: { picks: [{ tags: [], count: 2 }] },
      pool: generateSelfNamedBranches({ a: [], b: [], c: [] }),
      blockPool: generateSelfNamedBranches({ c: [], b: [], a: [] }),
      drawn: ["a", "b"],
    },
    {
      behaviour:
        "draws nothing when the block pool shares no branch with the workout pool",
      change: { picks: [{ tags: [], count: 2 }], fallbackToWholeTree: true },
      pool: generateSelfNamedBranches({ a: [], b: [] }),
      blockPool: generateSelfNamedBranches({ z: [] }),
      drawn: [],
    },
  ])("$behaviour", ({ change, pool, blockPool, drawn }) => {
    expect(
      drawBlockWithFirstUnusedBranch(change, pool, { blockPool }).drawn,
    ).toEqual(drawn);
  });
});

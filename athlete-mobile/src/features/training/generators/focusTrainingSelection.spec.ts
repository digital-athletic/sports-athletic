import type {
  BranchSelectionResult,
  SuperSetBranchSelectionResult,
} from "@/features/training/models/ExerciseBranch";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  drawBlock,
  filterByTags,
  type BranchDraw,
} from "./focusTrainingSelection";
import type { ResolvedBlock } from "./resolveTemplate";

type DrawBlock = Pick<
  ResolvedBlock,
  "pool" | "picks" | "countBy" | "fallbackToWholeTree"
>;

const branch = (tags: string[]): SkillTreeType[string] => ({
  tags,
  levels: { 1: { exerciseId: "1" } },
});

const tree = (entries: Record<string, string[]>): SkillTreeType =>
  Object.fromEntries(
    Object.entries(entries).map(([id, tags]) => [id, branch(tags)]),
  );

const block = (pool: SkillTreeType, change: Partial<DrawBlock>): DrawBlock => ({
  pool,
  picks: [{ tags: [], count: 1 }],
  countBy: "exercises",
  fallbackToWholeTree: false,
  ...change,
});

const selected = (
  branches: SkillTreeType,
  id: string,
): BranchSelectionResult => ({
  branchId: id,
  branch: { branchId: id, branchTags: branches[id].tags, exerciseId: id },
});

// Draws the first unused branch, so the order of the tree decides the draw.
const firstUnused: BranchDraw = {
  single: (branches, used) => {
    const id = Object.keys(branches).find((key) => !used.includes(key));
    return id ? selected(branches, id) : null;
  },
  pair: (branches, used): SuperSetBranchSelectionResult | null => {
    const [id, partnerId] = Object.keys(branches).filter(
      (key) => !used.includes(key),
    );
    if (!id) return null;
    return {
      ...selected(branches, id),
      fillUpBranchAndId: partnerId ? selected(branches, partnerId) : undefined,
    };
  },
};

// The block pool defaults to the context pool, as for a block without narrowing.
const drawnIds = (
  change: Partial<DrawBlock>,
  pool: SkillTreeType,
  blockPool: SkillTreeType = pool,
): string[] =>
  drawBlock(block(blockPool, change), {
    pool,
    draw: firstUnused,
    usedBranchIds: [],
  }).map(({ branchId }) => branchId);

describe("filterByTags: tag groups", () => {
  const branches = tree({
    knee: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP", "REGION_LOWER_BODY"],
    shoulder: ["SKILL_PREVENTION", "PREVENTION_SHOULDER"],
    warmUp: ["SKILL_WARM_UP", "PREVENTION_KNEE_HIP"],
    untagged: ["SKILL_PREVENTION"],
  });

  it("keeps every branch without tags", () => {
    expect(Object.keys(filterByTags(branches, []))).toEqual(
      Object.keys(branches),
    );
  });

  it("needs one listed tag of every named group", () => {
    expect(
      Object.keys(
        filterByTags(branches, ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"]),
      ),
    ).toEqual(["knee"]);
  });

  it("accepts any listed tag within a group", () => {
    expect(
      Object.keys(
        filterByTags(branches, [
          "SKILL_WARM_UP",
          "SKILL_PREVENTION",
          "PREVENTION_KNEE_HIP",
        ]),
      ),
    ).toEqual(["knee", "warmUp"]);
  });

  it("matches only branches carrying a tag outside every tag group", () => {
    const custom = tree({
      carrier: ["CUSTOM_X", "SKILL_PREVENTION"],
      other: ["SKILL_PREVENTION"],
      untagged: [],
    });

    expect(Object.keys(filterByTags(custom, ["CUSTOM_X"]))).toEqual([
      "carrier",
    ]);
  });

  it("lets a branch without a region tag match every region", () => {
    expect(Object.keys(filterByTags(branches, ["REGION_UPPER_BODY"]))).toEqual([
      "shoulder",
      "warmUp",
      "untagged",
    ]);
  });
});

// countBy "entries": a two sided exercise adds 1 entry, a one sided exercise adds 2 (left and right).
// The test draw takes the exercises in the order the pool lists them.
describe("drawBlock: count by entries", () => {
  const twoSided = ["SIDE_BOTH"];
  const oneSided = ["SIDE_ONE"];
  const drawEntries = (count: number, pool: SkillTreeType): string[] =>
    drawnIds({ countBy: "entries", picks: [{ tags: [], count }] }, pool);

  it("counts a two sided exercise as 1 entry", () => {
    const pool = tree({ pushUp: twoSided, squat: twoSided, burpee: twoSided });

    expect(drawEntries(2, pool)).toEqual(["pushUp", "squat"]);
  });

  it("counts a one sided exercise as 2 entries", () => {
    const pool = tree({
      singleArmRow: oneSided,
      pushUp: twoSided,
      squat: twoSided,
    });

    expect(drawEntries(3, pool)).toEqual(["singleArmRow", "pushUp"]);
  });

  it("never puts a one sided exercise into the last entry of the block", () => {
    const pool = tree({
      pushUp: twoSided,
      singleArmRow: oneSided,
      squat: twoSided,
    });

    expect(drawEntries(3, pool)).toEqual(["pushUp", "squat"]);
  });

  it("lets a one sided exercise fill the last entry of an earlier pick", () => {
    const pool = tree({
      singleArmRow: ["SIDE_ONE", "REGION_UPPER_BODY"],
      burpee: ["SIDE_BOTH", "REGION_FULL_BODY"],
    });
    const picks = [
      { tags: ["REGION_UPPER_BODY"], count: 2 },
      { tags: ["REGION_FULL_BODY"], count: 1 },
    ];

    expect(drawnIds({ countBy: "entries", picks }, pool)).toEqual([
      "singleArmRow",
      "burpee",
    ]);
  });

  it("skips a one sided exercise when only 1 entry is missing", () => {
    const pool = tree({
      pushUp: twoSided,
      singleArmRow: oneSided,
      squat: twoSided,
    });

    expect(drawEntries(2, pool)).toEqual(["pushUp", "squat"]);
  });

  it("draws one pick after the other", () => {
    const pool = tree({
      pushUp: ["SIDE_BOTH", "REGION_UPPER_BODY"],
      burpee: ["SIDE_BOTH", "REGION_FULL_BODY"],
      squat: ["SIDE_BOTH", "REGION_LOWER_BODY"],
    });
    const picks = [
      { tags: ["REGION_FULL_BODY"], count: 1 },
      { tags: ["REGION_LOWER_BODY"], count: 1 },
    ];

    expect(drawnIds({ countBy: "entries", picks }, pool)).toEqual([
      "burpee",
      "squat",
    ]);
  });

  describe("when the matching exercises run out", () => {
    const pool = tree({
      squat: ["SIDE_BOTH", "REGION_LOWER_BODY"],
      pushUp: ["SIDE_BOTH", "REGION_UPPER_BODY"],
    });
    const picks = [{ tags: ["REGION_LOWER_BODY"], count: 2 }];

    it("fills up from the whole pool with fallback", () => {
      expect(
        drawnIds(
          { countBy: "entries", picks, fallbackToWholeTree: true },
          pool,
        ),
      ).toEqual(["squat", "pushUp"]);
    });

    it("stays short without fallback", () => {
      expect(drawnIds({ countBy: "entries", picks }, pool)).toEqual(["squat"]);
    });
  });
});

describe("drawBlock: exercises", () => {
  it("counts a one sided exercise once", () => {
    const pool = tree({ a: ["SIDE_ONE"], b: ["SIDE_ONE"], c: ["SIDE_BOTH"] });

    expect(drawnIds({ picks: [{ tags: [], count: 2 }] }, pool)).toEqual([
      "a",
      "b",
    ]);
  });

  it("never draws a branch the training already uses", () => {
    const pool = tree({ a: [], b: [] });
    const drawn = drawBlock(block(pool, { picks: [{ tags: [], count: 2 }] }), {
      pool,
      draw: firstUnused,
      usedBranchIds: ["a"],
    });

    expect(drawn.map(({ branchId }) => branchId)).toEqual(["b"]);
  });
});

describe("drawBlock: pairs", () => {
  it("draws each pair with its partner and orders weighted pairs last", () => {
    const pool = tree({
      a: ["EQ_TYPE_WEIGHTS"],
      b: [],
      c: ["SIDE_BOTH"],
      d: ["SIDE_BOTH"],
    });

    expect(
      drawnIds({ countBy: "pairs", picks: [{ tags: [], count: 2 }] }, pool),
    ).toEqual(["c", "d", "a", "b"]);
  });

  it("stops when no pair is left", () => {
    const pool = tree({ a: [] });

    expect(
      drawnIds({ countBy: "pairs", picks: [{ tags: [], count: 3 }] }, pool),
    ).toEqual(["a"]);
  });
});

describe("drawBlock: used branch ids", () => {
  const usedAfter = (change: Partial<DrawBlock>, pool: SkillTreeType) => {
    const usedBranchIds: string[] = [];
    drawBlock(block(pool, change), { pool, draw: firstUnused, usedBranchIds });
    return usedBranchIds;
  };

  it("holds the drawn ids of an exercises block", () => {
    const pool = tree({ a: [], b: [], c: [] });

    expect(usedAfter({ picks: [{ tags: [], count: 2 }] }, pool)).toEqual([
      "a",
      "b",
    ]);
  });

  it("holds both branches of a drawn pair", () => {
    const pool = tree({ a: [], b: [], c: [] });

    expect(
      usedAfter({ countBy: "pairs", picks: [{ tags: [], count: 1 }] }, pool),
    ).toEqual(["a", "b"]);
  });

  // The draw marks the skipped branch used before the size check, so no
  // later pick of the training draws a one sided overflow branch again.
  it("holds a one sided branch that overflowed the last side", () => {
    const pool = tree({ a: ["SIDE_BOTH"], b: ["SIDE_ONE"], c: ["SIDE_BOTH"] });

    expect(
      usedAfter({ countBy: "entries", picks: [{ tags: [], count: 2 }] }, pool),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("drawBlock: block pool", () => {
  const contextPool = tree({ a: [], b: [], c: [] });

  it("never draws a branch outside the block pool", () => {
    expect(
      drawnIds(
        { picks: [{ tags: [], count: 3 }], fallbackToWholeTree: true },
        contextPool,
        tree({ b: [] }),
      ),
    ).toEqual(["b"]);
  });

  it("never falls back to a branch outside the block pool", () => {
    const outside = tree({ a: ["SKILL_X"], b: [], c: [] });

    expect(
      drawnIds(
        {
          picks: [{ tags: ["SKILL_X"], count: 2 }],
          fallbackToWholeTree: true,
        },
        outside,
        tree({ c: [] }),
      ),
    ).toEqual(["c"]);
  });

  it("keeps the key order of the context pool", () => {
    const reordered = tree({ c: [], b: [], a: [] });

    expect(
      drawnIds({ picks: [{ tags: [], count: 2 }] }, contextPool, reordered),
    ).toEqual(["a", "b"]);
  });

  it("draws nothing when the block pool shares no branch with the context pool", () => {
    expect(
      drawnIds(
        { picks: [{ tags: [], count: 2 }], fallbackToWholeTree: true },
        contextPool,
        tree({ z: [] }),
      ),
    ).toEqual([]);
  });
});

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

  it("lets a branch without a region tag match every region", () => {
    expect(Object.keys(filterByTags(branches, ["REGION_UPPER_BODY"]))).toEqual([
      "shoulder",
      "warmUp",
      "untagged",
    ]);
  });
});

describe("drawBlock: sides", () => {
  const pool = tree({
    a: ["SIDE_BOTH", "REGION_UPPER_BODY"],
    b: ["SIDE_ONE", "REGION_UPPER_BODY"],
    c: ["SIDE_BOTH", "REGION_FULL_BODY"],
    d: ["SIDE_ONE", "REGION_FULL_BODY"],
    e: ["SIDE_BOTH", "REGION_LOWER_BODY"],
  });

  it("fills two sides with a one sided exercise", () => {
    expect(
      drawnIds({ countBy: "sides", picks: [{ tags: [], count: 3 }] }, pool),
    ).toEqual(["a", "b"]);
  });

  it("skips a one sided exercise that does not fit the last side", () => {
    expect(
      drawnIds({ countBy: "sides", picks: [{ tags: [], count: 2 }] }, pool),
    ).toEqual(["a", "c"]);
  });

  it("draws the picks the block carries in several lists in order", () => {
    const regions = {
      countBy: "sides",
      picks: [
        { tags: ["REGION_FULL_BODY"], count: 1 },
        { tags: ["REGION_LOWER_BODY"], count: 1 },
      ],
    } satisfies Partial<DrawBlock>;

    expect(drawnIds(regions, pool)).toEqual(["c", "e"]);
  });

  it("falls back to the whole pool when the picks run out", () => {
    const lower = { tags: ["REGION_LOWER_BODY"], count: 2 };

    expect(
      drawnIds(
        { countBy: "sides", picks: [lower], fallbackToWholeTree: true },
        pool,
      ),
    ).toEqual(["e", "a"]);
    expect(drawnIds({ countBy: "sides", picks: [lower] }, pool)).toEqual(["e"]);
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

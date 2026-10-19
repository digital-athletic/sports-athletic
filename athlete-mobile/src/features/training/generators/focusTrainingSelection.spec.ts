import type {
  BranchSelectionResult,
  SuperSetBranchSelectionResult,
} from "@/features/training/models/ExerciseBranch";
import type {
  FocusTraining,
  FocusTrainingBlock,
} from "@/schemas/focusTraining.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  drawBlock,
  filterByTags,
  requireFocusEquipment,
  resolveFocusPool,
  type BranchDraw,
} from "./focusTrainingSelection";

const branch = (tags: string[]): SkillTreeType[string] => ({
  tags,
  levels: { 1: { exerciseId: "1" } },
});

const tree = (entries: Record<string, string[]>): SkillTreeType =>
  Object.fromEntries(
    Object.entries(entries).map(([id, tags]) => [id, branch(tags)]),
  );

const block = (change: Partial<FocusTrainingBlock>): FocusTrainingBlock => ({
  draw: "exercises",
  picks: [{ tags: [], count: 1 }],
  fallback: false,
  sets: 1,
  pause: { superset: 10, sets: 10, exercise: 10 },
  superset: "none",
  ...change,
});

const template = (change: Partial<FocusTraining>): FocusTraining => ({
  skillTree: "MOB",
  blocks: [block({})],
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

const drawnIds = (
  drawn: FocusTrainingBlock,
  pool: SkillTreeType,
  hasWeights = true,
): string[] =>
  drawBlock(drawn, hasWeights, {
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

describe("resolveFocusPool: skill trees", () => {
  const skillTrees = {
    GKS: tree({ weighted: ["REGION_CORE"] }),
    GKSKG: tree({ bodyweight: ["REGION_CORE"] }),
    PREV: tree({
      knee: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"],
      shoulder: ["SKILL_PREVENTION", "PREVENTION_SHOULDER"],
    }),
    PREVKG: tree({ kneeKg: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"] }),
    WUSPEZIAL: tree({ special: ["SKILL_WARM_UP_SPECIAL"] }),
  };

  it("picks the skill tree variant from the weights", () => {
    const gks = template({ skillTree: "GKS" });

    expect(Object.keys(resolveFocusPool("GKS", gks, skillTrees, true))).toEqual(
      ["weighted"],
    );
    expect(
      Object.keys(resolveFocusPool("GKS", gks, skillTrees, false)),
    ).toEqual(["bodyweight"]);
  });

  it("limits the skill tree to the template tags and adds the block skill trees", () => {
    const knee = template({
      skillTree: "PREVKNEE",
      tags: ["PREVENTION_KNEE_HIP"],
      blocks: [block({ skillTree: "WUSPEZIAL" }), block({})],
    });

    expect(
      Object.keys(resolveFocusPool("PREVKNEE", knee, skillTrees, true)),
    ).toEqual(["knee", "kneeKg", "special"]);
  });

  it("throws the tag values when no branch carries the template tags", () => {
    const spine = template({ skillTree: "PREV", tags: ["PREVENTION_SPINE"] });

    expect(() => resolveFocusPool("PREV", spine, skillTrees, true)).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "SKILL_TREE",
        params: ["SPINE"],
      }),
    );
  });
});

describe("requireFocusEquipment", () => {
  const foamRolling = template({
    requiredEquipment: ["FOAM_ROLLER", "FOAM_BALL"],
  });

  it("accepts an athlete with one of the required equipment", () => {
    expect(() =>
      requireFocusEquipment(foamRolling, ["MAT", "FOAM_BALL"]),
    ).not.toThrow();
  });

  it("throws the required equipment when the athlete has none of it", () => {
    expect(() => requireFocusEquipment(foamRolling, ["MAT"])).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "EQUIPMENT",
        params: ["FOAM_ROLLER", "FOAM_BALL"],
      }),
    );
  });

  it("accepts any athlete when the template requires no equipment", () => {
    expect(() => requireFocusEquipment(template({}), [])).not.toThrow();
  });
});

describe("drawBlock: slots", () => {
  const pool = tree({
    a: ["SIDE_BOTH", "REGION_UPPER_BODY"],
    b: ["SIDE_ONE", "REGION_UPPER_BODY"],
    c: ["SIDE_BOTH", "REGION_FULL_BODY"],
    d: ["SIDE_ONE", "REGION_FULL_BODY"],
    e: ["SIDE_BOTH", "REGION_LOWER_BODY"],
  });

  it("fills two slots with a one sided exercise", () => {
    expect(
      drawnIds(block({ draw: "slots", picks: [{ tags: [], count: 3 }] }), pool),
    ).toEqual(["a", "b"]);
  });

  it("skips a one sided exercise that does not fit the last slot", () => {
    expect(
      drawnIds(block({ draw: "slots", picks: [{ tags: [], count: 2 }] }), pool),
    ).toEqual(["a", "c"]);
  });

  it("draws the picks for athletes without weights when the athlete has none", () => {
    const regions = block({
      draw: "slots",
      picks: [{ tags: [], count: 1 }],
      picksWithoutWeights: [
        { tags: ["REGION_FULL_BODY"], count: 1 },
        { tags: ["REGION_LOWER_BODY"], count: 1 },
      ],
    });

    expect(drawnIds(regions, pool, false)).toEqual(["c", "e"]);
    expect(drawnIds(regions, pool, true)).toEqual(["a"]);
  });

  it("falls back to the whole pool when the picks run out", () => {
    const lower = { tags: ["REGION_LOWER_BODY"], count: 2 };

    expect(
      drawnIds(block({ draw: "slots", picks: [lower], fallback: true }), pool),
    ).toEqual(["e", "a"]);
    expect(drawnIds(block({ draw: "slots", picks: [lower] }), pool)).toEqual([
      "e",
    ]);
  });
});

describe("drawBlock: exercises", () => {
  it("counts a one sided exercise once", () => {
    const pool = tree({ a: ["SIDE_ONE"], b: ["SIDE_ONE"], c: ["SIDE_BOTH"] });

    expect(drawnIds(block({ picks: [{ tags: [], count: 2 }] }), pool)).toEqual([
      "a",
      "b",
    ]);
  });

  it("never draws a branch the training already uses", () => {
    const pool = tree({ a: [], b: [] });
    const drawn = drawBlock(block({ picks: [{ tags: [], count: 2 }] }), true, {
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
      drawnIds(block({ draw: "pairs", picks: [{ tags: [], count: 2 }] }), pool),
    ).toEqual(["c", "d", "a", "b"]);
  });

  it("stops when no pair is left", () => {
    const pool = tree({ a: [] });

    expect(
      drawnIds(block({ draw: "pairs", picks: [{ tags: [], count: 3 }] }), pool),
    ).toEqual(["a"]);
  });
});

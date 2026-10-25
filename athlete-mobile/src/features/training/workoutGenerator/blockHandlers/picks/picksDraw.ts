import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import type { BranchDraw } from "./branchDraw";
import { filterBranchesByTags } from "./branchTagFilter";
import type { ResolvedPicksBlock } from "./picksBlockResolution";

/** The resolved values of a picks block that its draw reads. */
export type PicksBlockDraw = Pick<
  ResolvedPicksBlock,
  "pool" | "picks" | "countBy" | "fallbackToWholeTree"
>;

/** The workout pool, the branch draws and the branches the workout uses. */
export interface DrawContext {
  readonly pool: SkillTreeType;
  readonly draw: BranchDraw;
  readonly usedBranchIds: readonly string[];
}

/** The drawn branches of a block and every branch the block marked used. */
export interface DrawnPicksBlock {
  readonly branches: BranchExerciseReference[];
  readonly usedBranchIds: string[];
}

interface PickDraw {
  readonly pool: SkillTreeType;
  readonly matching: SkillTreeType;
  readonly count: number;
  readonly fallback: boolean;
  readonly draw: BranchDraw;
  // the workout's used branches, growing with every draw of the block
  readonly usedBranchIds: string[];
}

const drawFromPick = <T>(
  pick: PickDraw,
  drawBranch: (branches: SkillTreeType, used: readonly string[]) => T | null,
): T | null =>
  drawBranch(pick.matching, pick.usedBranchIds) ??
  (pick.fallback ? drawBranch(pick.pool, pick.usedBranchIds) : null);

// Returns the pairs without and with weights apart, so weighted pairs can come last.
const drawPairs = (pick: PickDraw): BranchExerciseReference[][] => {
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (let i = 0; i < pick.count; i++) {
    const pair = drawFromPick(pick, pick.draw.pair);
    if (pair === null) break;
    const target = pair.lead.branchTags.includes("EQ_TYPE_WEIGHTS")
      ? weighted
      : drawn;
    for (const branch of pair.partner
      ? [pair.lead, pair.partner]
      : [pair.lead]) {
      target.push(branch);
      pick.usedBranchIds.push(branch.branchId);
    }
  }
  return [drawn, weighted];
};

// A branch that overflows the count stays used, so no later pick draws it.
const drawSingles = (
  pick: PickDraw,
  oneSidedSize: number,
): BranchExerciseReference[] => {
  const drawn: BranchExerciseReference[] = [];
  let filled = 0;
  while (filled < pick.count) {
    const branch = drawFromPick(pick, pick.draw.single);
    if (branch === null) break;
    pick.usedBranchIds.push(branch.branchId);
    const isOneSided = getTagValues(branch.branchTags, TagGroups.SIDE).includes(
      "ONE",
    );
    const size = isOneSided ? oneSidedSize : 1;
    if (filled + size > pick.count) continue;
    drawn.push(branch);
    filled += size;
  }
  return drawn;
};

/**
 * Draws the branches of one picks block, pick after pick, from the block's
 * pool in the key order of the workout pool. A pick draws from the branches
 * matching its tags, then from the whole block pool with fallback. Counting
 * by entries makes a one sided branch fill two entries; counting by pairs
 * orders weighted pairs last. The given used branches stay unchanged.
 *
 * drawPicksBlock({ pool: { a, b }, picks: [{ tags: [], count: 1 }], countBy: "exercises", ... },
 *   { pool: { a, b, c }, draw, usedBranchIds: ["a"] })
 * → { branches: [{ branchId: "b", ... }], usedBranchIds: ["b"] }
 */
export const drawPicksBlock = (
  block: PicksBlockDraw,
  context: DrawContext,
): DrawnPicksBlock => {
  const pool = Object.fromEntries(
    Object.entries(context.pool).filter(([id]) =>
      Object.hasOwn(block.pool, id),
    ),
  );
  const usedBranchIds = [...context.usedBranchIds];
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (const { tags, count } of block.picks) {
    const pick: PickDraw = {
      pool,
      matching: filterBranchesByTags(pool, tags),
      count,
      fallback: block.fallbackToWholeTree,
      draw: context.draw,
      usedBranchIds,
    };
    if (block.countBy === "pairs") {
      const [pairs, weightedPairs] = drawPairs(pick);
      drawn.push(...pairs);
      weighted.push(...weightedPairs);
    } else {
      drawn.push(...drawSingles(pick, block.countBy === "entries" ? 2 : 1));
    }
  }
  return {
    branches: [...drawn, ...weighted],
    usedBranchIds: usedBranchIds.slice(context.usedBranchIds.length),
  };
};

import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import type { BranchDraw } from "./branchDraw";
import { filterBranchesByTags } from "./branchTagFilter";
import type { ResolvedSelectionsBlock } from "./selectionsBlockResolution";

/** The resolved values of a selections block that its draw reads. */
export type SelectionsBlockDraw = Pick<
  ResolvedSelectionsBlock,
  "pool" | "selections" | "countBy" | "fallbackToWholeTree"
>;

/** The workout pool, the branch draws and the branches the workout uses. */
export interface DrawContext {
  readonly pool: SkillTreeType;
  readonly draw: BranchDraw;
  readonly usedBranchIds: readonly string[];
}

/** The drawn branches of a block and every branch the block marked used. */
export interface DrawnSelectionsBlock {
  readonly branches: BranchExerciseReference[];
  readonly usedBranchIds: string[];
}

interface SelectionDraw {
  readonly pool: SkillTreeType;
  readonly matching: SkillTreeType;
  readonly count: number;
  readonly fallback: boolean;
  readonly draw: BranchDraw;
  // the workout's used branches, growing with every draw of the block
  readonly usedBranchIds: string[];
}

const drawFromSelection = <T>(
  selection: SelectionDraw,
  drawBranch: (branches: SkillTreeType, used: readonly string[]) => T | null,
): T | null =>
  drawBranch(selection.matching, selection.usedBranchIds) ??
  (selection.fallback
    ? drawBranch(selection.pool, selection.usedBranchIds)
    : null);

// Returns the pairs without and with weights apart, so weighted pairs can come last.
const drawPairs = (selection: SelectionDraw): BranchExerciseReference[][] => {
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (let i = 0; i < selection.count; i++) {
    const pair = drawFromSelection(selection, selection.draw.pair);
    if (pair === null) break;
    const target = pair.lead.branchTags.includes("EQ_TYPE_WEIGHTS")
      ? weighted
      : drawn;
    for (const branch of pair.partner
      ? [pair.lead, pair.partner]
      : [pair.lead]) {
      target.push(branch);
      selection.usedBranchIds.push(branch.branchId);
    }
  }
  return [drawn, weighted];
};

// A branch that overflows the count stays used, so no later selection draws it.
const drawSingles = (
  selection: SelectionDraw,
  oneSidedSize: number,
): BranchExerciseReference[] => {
  const drawn: BranchExerciseReference[] = [];
  let filled = 0;
  while (filled < selection.count) {
    const branch = drawFromSelection(selection, selection.draw.single);
    if (branch === null) break;
    selection.usedBranchIds.push(branch.branchId);
    const isOneSided = getTagValues(branch.branchTags, TagGroups.SIDE).includes(
      "ONE",
    );
    const size = isOneSided ? oneSidedSize : 1;
    if (filled + size > selection.count) continue;
    drawn.push(branch);
    filled += size;
  }
  return drawn;
};

/**
 * Draws the branches of one selections block, selection after selection, from
 * the block's pool in the key order of the workout pool. A selection draws from
 * the branches matching its tags, then from the whole block pool with fallback.
 * Counting by entries makes a one sided branch fill two entries; counting by
 * pairs orders weighted pairs last. The given used branches stay unchanged.
 *
 * drawSelectionsBlock({ pool: { a, b }, selections: [{ tags: [], count: 1 }], countBy: "exercises", ... },
 *   { pool: { a, b, c }, draw, usedBranchIds: ["a"] })
 * → { branches: [{ branchId: "b", ... }], usedBranchIds: ["b"] }
 */
export const drawSelectionsBlock = (
  block: SelectionsBlockDraw,
  context: DrawContext,
): DrawnSelectionsBlock => {
  const pool = Object.fromEntries(
    Object.entries(context.pool).filter(([id]) =>
      Object.hasOwn(block.pool, id),
    ),
  );
  const usedBranchIds = [...context.usedBranchIds];
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (const { tags, count } of block.selections) {
    const selection: SelectionDraw = {
      pool,
      matching: filterBranchesByTags(pool, tags),
      count,
      fallback: block.fallbackToWholeTree,
      draw: context.draw,
      usedBranchIds,
    };
    if (block.countBy === "pairs") {
      const [pairs, weightedPairs] = drawPairs(selection);
      drawn.push(...pairs);
      weighted.push(...weightedPairs);
    } else {
      drawn.push(
        ...drawSingles(selection, block.countBy === "entries" ? 2 : 1),
      );
    }
  }
  return {
    branches: [...drawn, ...weighted],
    usedBranchIds: usedBranchIds.slice(context.usedBranchIds.length),
  };
};

import { TagGroups } from "@/constants/tagGroups";
import type {
  BranchExerciseReference,
  BranchSelectionResult,
  SuperSetBranchSelectionResult,
} from "@/features/training/models/ExerciseBranch";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues, isTagInGroup } from "@/utils/tagUtils";
import type { ResolvedBlock } from "./resolveTemplate";

export interface BranchDraw {
  single: (
    branches: SkillTreeType,
    usedBranchIds: string[],
  ) => BranchSelectionResult | null;
  pair: (
    branches: SkillTreeType,
    usedBranchIds: string[],
  ) => SuperSetBranchSelectionResult | null;
}

const TAG_GROUPS: string[] = Object.values(TagGroups);

// The longest matching group wins, so EQ_TYPE_WEIGHTS belongs to EQ_TYPE.
const tagGroupOf = (tag: string): string =>
  TAG_GROUPS.filter((group) => isTagInGroup(tag, group)).sort(
    (a, b) => b.length - a.length,
  )[0] ?? tag;

const matchesTags = (branchTags: string[], tags: string[]): boolean => {
  const tagsByGroup = new Map<string, string[]>();
  for (const tag of tags) {
    const group = tagGroupOf(tag);
    tagsByGroup.set(group, [...(tagsByGroup.get(group) ?? []), tag]);
  }
  return [...tagsByGroup].every(
    ([group, groupTags]) =>
      (group === TagGroups.REGION &&
        getTagValues(branchTags, TagGroups.REGION).length === 0) ||
      branchTags.some((tag) => groupTags.includes(tag)),
  );
};

/**
 * Keeps the branches with one listed tag of every tag group the tags name.
 * A branch without a region tag matches every region.
 */
export const filterByTags = (
  branches: SkillTreeType,
  tags: string[],
): SkillTreeType => {
  const kept: SkillTreeType = {};
  for (const id in branches) {
    if (matchesTags(branches[id].tags, tags)) kept[id] = branches[id];
  }
  return kept;
};

export interface DrawContext {
  pool: SkillTreeType;
  draw: BranchDraw;
  // Branches the training already uses; the draw adds its own.
  usedBranchIds: string[];
}

interface PickDraw extends DrawContext {
  matching: SkillTreeType;
  count: number;
  fallback: boolean;
}

const drawFrom = <T>(
  { matching, pool, fallback, usedBranchIds }: PickDraw,
  drawer: (branches: SkillTreeType, used: string[]) => T | null,
): T | null =>
  drawer(matching, usedBranchIds) ??
  (fallback ? drawer(pool, usedBranchIds) : null);

// Returns the pairs without and with weights apart, so weighted pairs can come last.
const drawPairs = (pick: PickDraw): BranchExerciseReference[][] => {
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (let i = 0; i < pick.count; i++) {
    const result = drawFrom(pick, pick.draw.pair);
    if (result === null) break;
    const target = result.branch.branchTags.includes("EQ_TYPE_WEIGHTS")
      ? weighted
      : drawn;
    const partner = result.fillUpBranchAndId?.branch;
    for (const branch of partner ? [result.branch, partner] : [result.branch]) {
      target.push(branch);
      pick.usedBranchIds.push(branch.branchId);
    }
  }
  return [drawn, weighted];
};

// With closesBlock, a one sided branch never takes the last entry of the block.
const drawSingles = (
  pick: PickDraw,
  oneSidedSize: number,
  closesBlock: boolean,
): BranchExerciseReference[] => {
  const drawn: BranchExerciseReference[] = [];
  let filled = 0;
  while (filled < pick.count) {
    const result = drawFrom(pick, pick.draw.single);
    if (result === null) break;
    pick.usedBranchIds.push(result.branchId);
    const isOneSided = getTagValues(
      result.branch.branchTags,
      TagGroups.SIDE,
    ).includes("ONE");
    const size = isOneSided ? oneSidedSize : 1;
    const takesLastEntry = closesBlock && filled + size === pick.count;
    if (filled + size > pick.count || (isOneSided && takesLastEntry)) continue;
    drawn.push(result.branch);
    filled += size;
  }
  return drawn;
};

/**
 * Draws the branches of one block and marks them used. A pairs block orders
 * its weighted pairs last.
 */
export const drawBlock = (
  block: Pick<
    ResolvedBlock,
    "pool" | "picks" | "countBy" | "fallbackToWholeTree"
  >,
  context: DrawContext,
): BranchExerciseReference[] => {
  // iterating the context pool keeps its key order
  const pool: SkillTreeType = {};
  for (const id in context.pool) {
    if (Object.hasOwn(block.pool, id)) pool[id] = context.pool[id];
  }
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (const [index, pick] of block.picks.entries()) {
    const pickDraw: PickDraw = {
      ...context,
      pool,
      matching: filterByTags(pool, pick.tags),
      count: pick.count,
      fallback: block.fallbackToWholeTree,
    };
    if (block.countBy === "pairs") {
      const [pairs, weightedPairs] = drawPairs(pickDraw);
      drawn.push(...pairs);
      weighted.push(...weightedPairs);
    } else {
      // a one sided exercise adds two entries, left and right
      const countsEntries = block.countBy === "entries";
      drawn.push(
        ...drawSingles(
          pickDraw,
          countsEntries ? 2 : 1,
          countsEntries && index === block.picks.length - 1,
        ),
      );
    }
  }
  return [...drawn, ...weighted];
};

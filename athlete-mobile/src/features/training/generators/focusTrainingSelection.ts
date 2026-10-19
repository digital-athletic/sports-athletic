import { TagGroups } from "@/constants/tagGroups";
import type {
  BranchExerciseReference,
  BranchSelectionResult,
  SuperSetBranchSelectionResult,
} from "@/features/training/models/ExerciseBranch";
import type { TrainingType } from "@/features/training/models/Training";
import { getSkillTree } from "@/features/training/utils/skillTreeUtils";
import type {
  FocusTraining,
  FocusTrainingBlock,
} from "@/schemas/focusTraining.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues, isTagInGroup } from "@/utils/tagUtils";
import type { GeneratorError } from "./GeneratorError";

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

const tagValueOf = (tag: string): string => {
  const group = tagGroupOf(tag);
  return group === tag ? tag : tag.slice(group.length + 1);
};

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

export const requireFocusEquipment = (
  template: FocusTraining,
  equipment: string[],
): void => {
  const required = template.requiredEquipment ?? [];
  if (required.length > 0 && !required.some((eq) => equipment.includes(eq))) {
    throw {
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: required,
    } satisfies GeneratorError;
  }
};

/**
 * Collects the branches a focus training draws from: its skill tree limited
 * to the template tags, plus the skill trees its blocks name.
 */
export const resolveFocusPool = (
  type: TrainingType,
  template: FocusTraining,
  skillTrees: { [skillName: string]: SkillTreeType },
  hasWeights: boolean,
): SkillTreeType => {
  const tags = template.tags ?? [];
  const pool = filterByTags(
    getSkillTree(skillTrees, template.skillTree, [], hasWeights, true),
    tags,
  );
  if (tags.length > 0 && Object.keys(pool).length === 0) {
    throw {
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: tags.map(tagValueOf),
    } satisfies GeneratorError;
  }
  for (const { skillTree } of template.blocks) {
    if (skillTree) {
      Object.assign(
        pool,
        getSkillTree(skillTrees, skillTree, [type], hasWeights),
      );
    }
  }
  return pool;
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

const drawSingles = (
  pick: PickDraw,
  oneSidedSize: number,
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
    if (filled + size > pick.count) continue;
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
  block: FocusTrainingBlock,
  hasWeights: boolean,
  context: DrawContext,
): BranchExerciseReference[] => {
  const picks =
    !hasWeights && block.picksWithoutWeights
      ? block.picksWithoutWeights
      : block.picks;
  const drawn: BranchExerciseReference[] = [];
  const weighted: BranchExerciseReference[] = [];
  for (const pick of picks) {
    const pickDraw: PickDraw = {
      ...context,
      matching: filterByTags(context.pool, pick.tags),
      count: pick.count,
      fallback: block.fallback,
    };
    if (block.draw === "pairs") {
      const [pairs, weightedPairs] = drawPairs(pickDraw);
      drawn.push(...pairs);
      weighted.push(...weightedPairs);
    } else {
      // a one sided exercise fills two slots, left and right
      drawn.push(...drawSingles(pickDraw, block.draw === "slots" ? 2 : 1));
    }
  }
  return [...drawn, ...weighted];
};

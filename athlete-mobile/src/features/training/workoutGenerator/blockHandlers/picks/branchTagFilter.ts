import { TagGroups } from "@/constants/tagGroups";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues, isTagInGroup } from "@/utils/tagUtils";

const TAG_GROUPS: string[] = Object.values(TagGroups);

// The longest matching group wins, so EQ_TYPE_WEIGHTS belongs to EQ_TYPE.
const readTagGroup = (tag: string): string =>
  TAG_GROUPS.filter((group) => isTagInGroup(tag, group)).sort(
    (a, b) => b.length - a.length,
  )[0] ?? tag;

const matchesEveryTagGroup = (
  branchTags: string[],
  tags: readonly string[],
): boolean => {
  const tagsByGroup = new Map<string, string[]>();
  for (const tag of tags) {
    const group = readTagGroup(tag);
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
 * A branch without a region tag matches every region; a tag outside every
 * group forms its own group.
 *
 * filterBranchesByTags({ 1: { tags: ["SKILL_WARM_UP"], ... }, 2: { tags: [], ... } }, ["SKILL_WARM_UP"])
 * → { 1: { tags: ["SKILL_WARM_UP"], ... } }
 */
export const filterBranchesByTags = (
  branches: SkillTreeType,
  tags: readonly string[],
): SkillTreeType =>
  Object.fromEntries(
    Object.entries(branches).filter(([, branch]) =>
      matchesEveryTagGroup(branch.tags, tags),
    ),
  );

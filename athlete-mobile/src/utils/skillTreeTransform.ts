import type { SkillTreeType } from "@/store/skillTreesStore";

type RawSkillTree = Record<
  string,
  {
    tags: string[];
    levels: Record<string, { id: number }>;
  }
>;

/**
 * Transforms a raw skill tree by converting exercise IDs to strings and level keys to numbers.
 * This is applied when loading skill tree JSON data into the store.
 */
export const transformSkillTree = (rawTree: RawSkillTree): SkillTreeType => {
  const result: SkillTreeType = {};

  for (const branchId in rawTree) {
    if (Object.prototype.hasOwnProperty.call(rawTree, branchId)) {
      const branch = rawTree[branchId];
      const transformedLevels: Record<number, { id: string }> = {};

      for (const level in branch.levels) {
        if (Object.prototype.hasOwnProperty.call(branch.levels, level)) {
          transformedLevels[Number(level)] = {
            id: String(branch.levels[level].id),
          };
        }
      }

      result[branchId] = {
        tags: branch.tags,
        levels: transformedLevels,
      };
    }
  }

  return result;
};

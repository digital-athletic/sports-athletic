import type { SkillTreeType } from "@/schemas/skillTree.schema";

type RawSkillTree = Record<
  string,
  {
    tags: string[];
    levels: Record<string, { exerciseId?: number; id?: number }>;
  }
>;

/**
 * Transforms a raw skill tree by converting exercise IDs to strings and level keys to numbers.
 * Supports both old format (id) and new format (exerciseId) for backward compatibility.
 * This is applied when loading skill tree JSON data into the store.
 */
export const transformSkillTree = (rawTree: RawSkillTree): SkillTreeType => {
  const result: SkillTreeType = {};

  for (const branchId in rawTree) {
    if (Object.prototype.hasOwnProperty.call(rawTree, branchId)) {
      const branch = rawTree[branchId];
      const transformedLevels: Record<number, { exerciseId: string }> = {};

      for (const level in branch.levels) {
        if (Object.prototype.hasOwnProperty.call(branch.levels, level)) {
          const levelData = branch.levels[level];
          const rawId = levelData.exerciseId ?? levelData.id;
          transformedLevels[Number(level)] = {
            exerciseId: String(rawId),
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

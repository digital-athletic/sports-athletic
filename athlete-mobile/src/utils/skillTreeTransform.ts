import type { SkillTreeType } from "@/schemas/skillTree.schema";

export type RawSkillTree = Record<
  string,
  {
    tags: string[];
    levels: Record<string, { exerciseId: string }>;
  }
>;

/**
 * Transforms a raw skill tree by converting level keys from strings to numbers.
 * JSON cannot have numeric keys, so this conversion is still needed at runtime.
 * The JSON files have been pre-transformed to already use:
 * - 'exerciseId' (instead of 'id')
 * - String exercise IDs (instead of numbers)
 */
export const transformSkillTree = (rawTree: RawSkillTree): SkillTreeType => {
  const result: SkillTreeType = {};

  for (const branchId in rawTree) {
    if (Object.prototype.hasOwnProperty.call(rawTree, branchId)) {
      const branch = rawTree[branchId];
      const transformedLevels: Record<number, { exerciseId: string }> = {};

      for (const level in branch.levels) {
        if (Object.prototype.hasOwnProperty.call(branch.levels, level)) {
          transformedLevels[Number(level)] = branch.levels[level];
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

/**
 * Represents a skill branch with its tags and level-specific exercise mappings.
 */
export type SkillBranchType = {
  tags: string[];
  levels: Record<string, { id: number }>;
};

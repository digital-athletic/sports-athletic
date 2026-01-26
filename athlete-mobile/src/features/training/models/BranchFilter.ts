/**
 * Shared types for branch filtering utilities.
 */

/**
 * Represents a branch with tags and exercises/levels.
 * This is used as a unified base for SkillBranchType and ExerciseBranchType.
 * Accepts both `id` and `exerciseId` patterns for compatibility with
 * different data sources (skillTree uses `id`, exerciseBranch uses `exerciseId`).
 * Note: tags is optional to support different schema variations but filter
 * functions treat missing tags as empty array.
 */
export interface Branch {
  tags?: string[];
  exercises?: Record<string, { exerciseId?: string; id?: string }>;
  levels?: Record<string | number, { exerciseId?: string; id?: string }>;
  exerciseBranchId?: string;
}

/**
 * Represents a filtered result with branches to keep and replace reasons.
 */
export interface FilterResult<T> {
  keep: Record<string, T>;
  replace: string[];
  missingEquipment?: string[];
}

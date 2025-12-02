/**
 * Shared types for branch filtering utilities.
 */

/**
 * Represents a branch with tags and exercises/levels.
 * This is used as a unified base for SkillBranchType and ExerciseBranchType
 */
export interface Branch {
  tags: string[];
  exercises?: Record<string, { exerciseId: number }>;
  levels?: Record<string, { id: number }>;
}

/**
 * Represents a filtered result with branches to keep and replace reasons.
 */
export interface FilterResult<T> {
  keep: Record<string, T>;
  replace: string[];
  missingEquipment?: string[];
}

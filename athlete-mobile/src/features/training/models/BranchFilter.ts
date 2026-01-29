/**
 * Shared types for branch filtering utilities.
 */

/**
 * Represents a branch with tags and exercises/levels.
 * This is used as a unified base for SkillBranchType and ExerciseBranchType.
 * Level keys are numbers (converted from string during import).
 * Note: tags is optional to support different schema variations but filter
 * functions treat missing tags as empty array.
 */
export interface Branch {
  tags?: string[];
  exercises?: Record<number, { exerciseId?: string }>;
  levels?: Record<number, { exerciseId?: string }>;
  branchId?: string;
}

/**
 * Represents a filtered result with branches to keep and replace reasons.
 */
export interface FilterResult<T> {
  keep: Record<string, T>;
  replace: string[];
  missingEquipment?: string[];
}

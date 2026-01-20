export type ExerciseBranchType = {
  exerciseBranchId: number;
  tags: string[];
  exercises: { [level: number]: { exerciseId: number } };
};

/**
 * Reference to a specific exercise within a skill tree branch.
 * Used throughout training generation to track exercise selections.
 *
 * Note: branchId of -1 indicates a placeholder/pause entry, not a real branch.
 */
export type BranchExerciseReference = {
  branchId: number;
  branchTags: string[];
  exerciseId: number;
};

/**
 * A pair of exercises for superset training.
 * First exercise is always present, second is optional (for single exercises).
 */
export type ExercisePair = {
  first: BranchExerciseReference;
  second?: BranchExerciseReference;
};

/**
 * Result from selecting a branch from a skill tree.
 * Contains the exercise reference and the numeric branch ID.
 */
export type BranchSelectionResult = {
  branch: BranchExerciseReference;
  /** The branch ID (converted from skill tree key to number) */
  id: number;
};

/**
 * Result from selecting a superset pair branch.
 * May include a fill-up branch for completing the superset.
 */
export type SuperSetBranchSelectionResult = {
  branch: BranchExerciseReference;
  id: number;
  fillUpBranchAndId?: BranchSelectionResult;
  replacementBranchesAndIds?: BranchSelectionResult[];
};

/**
 * Skill list entry containing branches for a specific skill.
 * Used during training generation to organize exercises by skill type.
 */
export type SkillBranchList = {
  skill: string;
  length?: number;
  branches: BranchExerciseReference[];
};

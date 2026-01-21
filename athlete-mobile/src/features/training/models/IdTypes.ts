/** Placeholder branch ID used for pause entries and unassigned branches */
export const PLACEHOLDER_BRANCH_ID = "-1";

/** Special exercise ID used for pause/rest entries */
export const PAUSE_EXERCISE_ID = "999999";

/** Check if a branch ID represents a placeholder (not a real branch) */
export const isPlaceholderBranch = (id: string): boolean =>
  id === PLACEHOLDER_BRANCH_ID;

/** Check if an exercise ID represents a pause/rest entry */
export const isPauseExercise = (id: string): boolean =>
  id === PAUSE_EXERCISE_ID;

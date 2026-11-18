import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import type { StoredBranch } from "../branches/storedBranchLookup";

// A level may name its exercise under `id`; resolution reads it after `exerciseId`.
type StoredBranchLevel = { exerciseId?: string; id?: string };

/** A branch as resolution reads it: from a skill tree or a stored day entry. */
export interface ResolvableBranch {
  tags?: string[];
  levels: Record<number, StoredBranchLevel>;
}

/**
 * Maps the athlete's fitness level to the entry level of a branch.
 * Entry caps at 3; levels 4 to 6 are earned by training.
 *
 * mapFitnessLevelToEntryLevel("ADVANCED") → 2
 */
export const mapFitnessLevelToEntryLevel = (fitnessLevel: string): number => {
  if (fitnessLevel === "PROFESSIONAL") {
    return 3;
  }
  if (fitnessLevel === "ADVANCED") {
    return 2;
  }
  return 1;
};

/**
 * Resolves the branch level: the athlete's stored branch level when the
 * branch authors it, otherwise the entry level of the fitness level, falling
 * back downward to the highest authored level. Returns null when no such
 * level exists.
 *
 * resolveBranchLevel({ levels: { 1: ..., 2: ..., 4: ... } }, "PROFESSIONAL") → 2
 */
export const resolveBranchLevel = (
  branch: ResolvableBranch,
  fitnessLevel: string,
  athleteBranchLevel?: UserExerciseBranchDataType | null,
): number | null => {
  if (athleteBranchLevel?.level && branch.levels[athleteBranchLevel.level]) {
    return athleteBranchLevel.level;
  }
  for (
    let level = mapFitnessLevelToEntryLevel(fitnessLevel);
    level > 0;
    level--
  ) {
    if (branch.levels[level]) {
      return level;
    }
  }
  return null;
};

/**
 * Resolves the exercise ID at the resolved branch level, or null.
 */
export const resolveBranchExerciseId = (
  branch: ResolvableBranch,
  fitnessLevel: string,
  athleteBranchLevel?: UserExerciseBranchDataType | null,
): string | null => {
  const level = resolveBranchLevel(branch, fitnessLevel, athleteBranchLevel);
  if (level === null) {
    return null;
  }
  const storedLevel: StoredBranchLevel = branch.levels[level];
  return storedLevel.exerciseId || storedLevel.id || null;
};

/**
 * Resolves the catalog exercise at the resolved branch level. Returns null
 * when no level resolves or the catalog lacks the exercise.
 */
export const resolveBranchExercise = (
  branch: ResolvableBranch,
  fitnessLevel: string,
  exerciseCatalog: readonly ExerciseType[],
  athleteBranchLevel?: UserExerciseBranchDataType | null,
): ExerciseType | null => {
  const exerciseId = resolveBranchExerciseId(
    branch,
    fitnessLevel,
    athleteBranchLevel,
  );
  if (exerciseId === null) {
    return null;
  }
  return exerciseCatalog.find(({ id }) => id === exerciseId) ?? null;
};

/**
 * Resolves a stored branch to its exercise reference. The reference carries
 * the exercise's tags, else the branch's. Exercise ID "-1" marks a branch
 * without an exercise, which the set list builder drops.
 *
 * resolveStoredBranchExercise({ branchId: "510", branch }, "ADVANCED", exerciseCatalog, null)
 * → { branchId: "510", exerciseId: "20", branchTags: ["EQ_TYPE_WEIGHTS", ...] }
 */
export const resolveStoredBranchExercise = (
  { branchId, branch }: StoredBranch,
  fitnessLevel: string,
  exerciseCatalog: readonly ExerciseType[],
  athleteBranchLevel: UserExerciseBranchDataType | null,
): BranchExerciseReference => {
  const tags = branch.tags ?? [];
  // A stored day entry names its exercises under `exercises`, a catalog
  // branch under `levels`; the catalog lookup needs the second.
  const exercise = resolveBranchExercise(
    { levels: branch.exercises ?? branch.levels ?? {}, tags },
    fitnessLevel,
    exerciseCatalog,
    athleteBranchLevel,
  );
  return {
    branchId,
    branchTags: exercise ? exercise.tags : tags,
    exerciseId: exercise?.id ?? "-1",
  };
};

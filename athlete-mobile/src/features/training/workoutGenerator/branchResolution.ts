import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";

// A level may name its exercise under `id`; resolution reads it after `exerciseId`.
type StoredBranchLevel = { exerciseId?: string; id?: string };

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
 * Resolves the branch level: the stored level when the branch authors it,
 * otherwise the entry level of the fitness level, falling back downward to
 * the highest authored level. Returns null when no such level exists.
 *
 * resolveBranchLevel({ levels: { 1: ..., 2: ..., 4: ... } }, "PROFESSIONAL") → 2
 */
export const resolveBranchLevel = (
  branch: SkillBranchType,
  fitnessLevel: string,
  branchProgress?: UserExerciseBranchDataType | null,
): number | null => {
  if (branchProgress?.level && branch.levels[branchProgress.level]) {
    return branchProgress.level;
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
  branch: SkillBranchType,
  fitnessLevel: string,
  branchProgress?: UserExerciseBranchDataType | null,
): string | null => {
  const level = resolveBranchLevel(branch, fitnessLevel, branchProgress);
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
  branch: SkillBranchType,
  fitnessLevel: string,
  exerciseCatalog: readonly ExerciseType[],
  branchProgress?: UserExerciseBranchDataType | null,
): ExerciseType | null => {
  const exerciseId = resolveBranchExerciseId(
    branch,
    fitnessLevel,
    branchProgress,
  );
  if (exerciseId === null) {
    return null;
  }
  return exerciseCatalog.find(({ id }) => id === exerciseId) ?? null;
};

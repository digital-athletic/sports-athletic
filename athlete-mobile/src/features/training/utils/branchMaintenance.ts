import { SharedConstants } from "@/constants/sharedConstants";
import { findNextExerciseInBranch } from "@/features/training/utils/branchLevelUtils";
import { resolveBranchLevel } from "@/features/training/utils/skillTreeUtils";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type {
  BranchDataMapType,
  UserExerciseBranchDataType,
} from "@/store/exerciseProgressStore";

const DECAY_PAUSE_IN_MS = 12 * 7 * SharedConstants.TIME_IN_MS.DAY;

export interface BranchMaintenanceInput {
  branchData: BranchDataMapType;
  branches: Record<string, SkillBranchType>;
  fitnessLevel: string;
  /** Timestamp of the latest completed session, null without any. */
  lastSessionAt: number | null;
  now: number;
}

const authoredLevels = (branch: SkillBranchType): number[] =>
  Object.keys(branch.levels).map(Number);

const exerciseAt = (branch: SkillBranchType, level: number) =>
  branch.levels[level]?.exerciseId;

/**
 * Keeps an authored level, moves to the one level that now holds the stored
 * exercise, else falls back to the next lower authored level.
 */
const reconcile = (
  branch: SkillBranchType,
  entry: UserExerciseBranchDataType,
): UserExerciseBranchDataType => {
  const levels = authoredLevels(branch);
  const current = exerciseAt(branch, entry.level);
  if (current) {
    return current === entry.exerciseId
      ? entry
      : { ...entry, exerciseId: current };
  }

  const matches = levels.filter(
    (level) => exerciseAt(branch, level) === entry.exerciseId,
  );
  const lower = levels.filter((level) => level < entry.level);
  const level =
    matches.length === 1
      ? matches[0]
      : lower.length > 0
        ? Math.max(...lower)
        : null;
  if (level === null) return entry;
  return { ...entry, level, exerciseId: exerciseAt(branch, level) };
};

/** Drops one level per 12-week pause, like a level down, never below the entry level. */
const decay = (
  branch: SkillBranchType,
  entry: UserExerciseBranchDataType,
  input: BranchMaintenanceInput,
): UserExerciseBranchDataType => {
  const { lastSessionAt, now, fitnessLevel } = input;
  if (lastSessionAt === null) return entry;

  const dueSteps = Math.floor((now - lastSessionAt) / DECAY_PAUSE_IN_MS);
  const appliedSteps =
    entry.decay?.since === lastSessionAt ? entry.decay.steps : 0;
  if (dueSteps <= appliedSteps) return entry;

  const entryLevel = resolveBranchLevel(branch, fitnessLevel) ?? 0;
  let { level, exerciseId } = entry;
  for (let step = appliedSteps; step < dueSteps; step++) {
    const lower = findNextExerciseInBranch(
      branch,
      exerciseAt(branch, level) ?? "",
      level - 1,
      false,
    );
    if (!lower || lower.level < entryLevel) break;
    level = lower.level;
    exerciseId = lower.exerciseId;
  }
  return {
    ...entry,
    level,
    exerciseId,
    decay: { since: lastSessionAt, steps: dueSteps },
  };
};

/**
 * Reconciles every stored branch level with the shipped trees, then applies the
 * decay after long inactivity. Returns the input map when nothing changes.
 */
export const maintainBranchLevels = (
  input: BranchMaintenanceInput,
): BranchDataMapType => {
  let changed = false;
  const result: BranchDataMapType = {};
  for (const [branchId, entry] of Object.entries(input.branchData)) {
    const branch = input.branches[branchId];
    const maintained =
      entry && branch ? decay(branch, reconcile(branch, entry), input) : entry;
    if (maintained !== entry) changed = true;
    result[branchId] = maintained;
  }
  return changed ? result : input.branchData;
};

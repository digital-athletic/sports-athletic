import { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import { getEntryLevel } from "@/features/training/utils/skillTreeUtils";
import { BranchDataMapType } from "@/store/exerciseProgressStore";

export interface SubstituteLevel {
  branchId: string;
  level: number;
  exerciseId: string;
}

/**
 * Target level of a substitute branch: the higher of the entry level and the
 * level stored for that branch. The exhausted branch's level does not transfer.
 */
export function getSubstitutionTargetLevel(
  branchId: string,
  branchData: BranchDataMapType,
  userLevel: string,
): number {
  return Math.max(getEntryLevel(userLevel), branchData[branchId]?.level ?? 0);
}

/**
 * Returns the level to store for a substitute whose stored level lies below
 * its target level, so resolution does not fall back to the stale level.
 * Uses the highest authored level within two levels below the target.
 */
export function getRaisedSubstituteLevel(
  substitute: ExerciseBranchType,
  branchData: BranchDataMapType,
  userLevel: string,
): SubstituteLevel | null {
  const storedLevel = branchData[substitute.branchId]?.level;
  if (storedLevel === undefined) {
    return null;
  }

  const target = getSubstitutionTargetLevel(
    substitute.branchId,
    branchData,
    userLevel,
  );
  for (
    let level = target;
    level > storedLevel && level >= target - 2;
    level--
  ) {
    const exerciseId = substitute.exercises[level]?.exerciseId;
    if (exerciseId) {
      return { branchId: substitute.branchId, level, exerciseId };
    }
  }
  return null;
}

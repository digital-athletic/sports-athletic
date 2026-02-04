import { TagGroups } from "@/constants/tagGroups";
import type { SkillTreesState } from "@/data/skillTreeRegistry";
import { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import { getRegionsForPreventionSkills } from "@/features/training/utils/preventionUtils";
import { getSkillTree } from "@/features/training/utils/skillTreeUtils";
import { getEquivalentBranchWithGivenLevel } from "@/features/training/utils/workoutUtils";
import { BranchDataMapType } from "@/store/exerciseProgressStore";
import { getTagValues } from "@/utils/tagUtils";

export interface BranchLevelContext {
  skillTrees: SkillTreesState["skillTrees"];
  branchData: BranchDataMapType;
  equipment: string[];
  gender: string;
  exerciseList: UserExerciseDataType[] | null;
}

export interface TrainingPlanContext {
  type: string;
  sectionIndex?: number;
  weekday?: number;
}

export interface BranchLevelUpdateInput {
  levelUp: boolean;
  branchId: string;
  exerciseId: string;
  skill: SkillCode;
  ageGroup: string;
}

export type BranchLevelResult =
  | {
      type: "SAME_BRANCH";
      branchId: string;
      newLevel: number;
    }
  | {
      type: "BRANCH_SUBSTITUTION";
      previousBranchId: string;
      equivalentBranches: ExerciseBranchType[];
      sectionIndex: number;
      weekday: number;
      skill: SkillCode;
    }
  | {
      type: "NO_CHANGE";
      reason: "same_branch_found" | "no_matching_branch_found";
      branchId: string;
    }
  | {
      type: "BRANCH_NOT_FOUND";
      branchId: string;
    };

/**
 * Find the current level for a branch from branchData or as fallback from branch levels.
 */
export function findCurrentBranchLevel(
  branchId: string,
  exerciseId: string,
  branch: SkillBranchType,
  branchData: BranchDataMapType,
): number {
  const userBranchData = branchData[branchId];
  if (userBranchData) {
    return userBranchData.level;
  }

  // Fallback: look for exercise id in branch levels
  const levelKeys = Object.keys(branch.levels).map(Number);
  return levelKeys.reduce<number>((currentLevel, level) => {
    // Start with lowest level
    if (currentLevel === -1) {
      return level;
    }
    // If branchLevel is not matching yet, but level is
    if (
      currentLevel !== level &&
      branch.levels[level] &&
      branch.levels[level].exerciseId === exerciseId
    ) {
      return level;
    }
    return currentLevel;
  }, -1);
}

/**
 * Find the next exercise in the same branch, skipping levels with the same exercise ID.
 * Returns the new exercise ID and level, or null if not found.
 */
export function findNextExerciseInBranch(
  branch: SkillBranchType,
  currentExerciseId: string,
  targetLevel: number,
  levelUp: boolean,
): { exerciseId: string; level: number } | null {
  if (!branch.levels || !branch.levels[targetLevel]) {
    return null;
  }

  let newLevel = targetLevel;
  let newExerciseId = branch.levels[newLevel]?.exerciseId;

  // Skip levels with the same exercise
  while (
    newLevel > 1 &&
    branch.levels[newLevel] &&
    newExerciseId &&
    newExerciseId === currentExerciseId
  ) {
    if (levelUp) {
      newLevel++;
    } else {
      newLevel--;
    }
    if (branch.levels[newLevel]) {
      newExerciseId = branch.levels[newLevel].exerciseId;
    }
  }

  if (newExerciseId && newExerciseId !== currentExerciseId) {
    return { exerciseId: newExerciseId, level: newLevel };
  }

  // If we still have the same exercise after skipping, check if there's a valid exercise
  if (newExerciseId) {
    return { exerciseId: newExerciseId, level: newLevel };
  }

  return null;
}

/**
 * Get branch IDs currently in use from the exercise list.
 * Filters out invalid branch IDs (placeholder, undefined) and deduplicates.
 */
export function getBranchIdsInUse(
  exerciseList: UserExerciseDataType[] | null,
): string[] {
  if (!exerciseList) {
    return [];
  }

  return exerciseList.reduce<string[]>((acc, { branchId }) => {
    if (!branchId || isPlaceholderBranch(branchId) || acc.includes(branchId)) {
      return acc;
    }
    return acc.concat([branchId]);
  }, []);
}

/**
 * Check if ONE-to-BOTH compensation is needed.
 * Returns true if switching from ONE-sided to BOTH-sided exercise (non-prevention).
 */
export function needsOneToBothCompensation(
  originalTags: string[],
  replacementTags: string[],
): boolean {
  const isPrevention =
    getTagValues(originalTags, TagGroups.PREVENTION).length > 0;
  if (isPrevention) {
    return false;
  }

  const originalSide = getTagValues(originalTags, TagGroups.SIDE);
  const replacementSide = getTagValues(replacementTags, TagGroups.SIDE);

  return (
    originalSide.indexOf("ONE") > -1 && replacementSide.indexOf("BOTH") > -1
  );
}

/**
 * Calculate what should happen when updating a branch level.
 * Pure function - no side effects, returns a discriminated union result.
 */
export function calculateBranchLevelUpdate(
  input: BranchLevelUpdateInput,
  context: BranchLevelContext,
  planContext: TrainingPlanContext,
): BranchLevelResult {
  const { levelUp, branchId, exerciseId, skill, ageGroup } = input;
  const { skillTrees, branchData, equipment, gender, exerciseList } = context;
  const { type, sectionIndex, weekday } = planContext;

  const levelChange = levelUp ? 1 : -1;

  // Find branch in skill tree
  const allSkillTrees = getSkillTree(skillTrees, "ALL", [], true);
  const branch = allSkillTrees[branchId];

  if (!branch) {
    return { type: "BRANCH_NOT_FOUND", branchId };
  }

  // Find current level
  const branchLevel = findCurrentBranchLevel(
    branchId,
    exerciseId,
    branch,
    branchData,
  );
  const newLevel = branchLevel + levelChange;

  // Try to find next exercise in same branch
  const nextInBranch = findNextExerciseInBranch(
    branch,
    exerciseId,
    newLevel,
    levelUp,
  );

  if (nextInBranch) {
    return {
      type: "SAME_BRANCH",
      branchId,
      newLevel: nextInBranch.level,
    };
  }

  // No next exercise found in same branch - look for equivalent branch (PLAN only)
  if (type !== "PLAN") {
    return { type: "NO_CHANGE", reason: "no_matching_branch_found", branchId };
  }

  // Search for equivalent branch with new level
  const searchLevel = Math.max(1, newLevel);
  const prevRegions = getRegionsForPreventionSkills([skill]);

  let skillTree = getSkillTree(skillTrees, skill, [], false);
  if (hasWeights(equipment)) {
    skillTree = Object.assign(
      skillTree,
      getSkillTree(skillTrees, skill, [], true),
    );
  }

  const branchIdsInUse = getBranchIdsInUse(exerciseList);

  const equivalentBranches: ExerciseBranchType[] = [];
  const equivalent = getEquivalentBranchWithGivenLevel(
    skillTree,
    branchId,
    branch,
    searchLevel,
    branchIdsInUse,
    equipment,
    ageGroup,
    gender,
    prevRegions,
    skill,
  );

  if (equivalent) {
    equivalentBranches.push(equivalent);
  }

  const [match] = equivalentBranches;

  // Check for ONE-to-BOTH compensation
  if (match && needsOneToBothCompensation(branch.tags, match.tags)) {
    const equivalentOtherSide = getEquivalentBranchWithGivenLevel(
      skillTree,
      branchId,
      match,
      searchLevel,
      branchIdsInUse,
      equipment,
      ageGroup,
      gender,
      prevRegions,
      skill,
    );
    if (equivalentOtherSide) {
      equivalentBranches.push(equivalentOtherSide);
    }
  }

  if (match && sectionIndex !== undefined && weekday !== undefined) {
    if (match.branchId !== branchId) {
      return {
        type: "BRANCH_SUBSTITUTION",
        previousBranchId: branchId,
        equivalentBranches,
        sectionIndex,
        weekday,
        skill,
      };
    }
    return { type: "NO_CHANGE", reason: "same_branch_found", branchId };
  }

  return { type: "NO_CHANGE", reason: "no_matching_branch_found", branchId };
}

export interface BranchLevelCallbacks {
  setBranchLevel: (branchId: string, level: number) => void;
  replaceBranchInTrainingPlan: (
    sectionIndex: number,
    weekday: number,
    skill: SkillCode,
    branchId: string,
    equivalentBranches: ExerciseBranchType[],
  ) => void;
}

/**
 * Apply the branch level update result using the provided callbacks.
 */
export function applyBranchLevelUpdate(
  result: BranchLevelResult,
  callbacks: BranchLevelCallbacks,
): void {
  switch (result.type) {
    case "SAME_BRANCH":
      callbacks.setBranchLevel(result.branchId, result.newLevel);
      break;
    case "BRANCH_SUBSTITUTION":
      callbacks.replaceBranchInTrainingPlan(
        result.sectionIndex,
        result.weekday,
        result.skill,
        result.previousBranchId,
        result.equivalentBranches,
      );
      break;
    case "NO_CHANGE":
    case "BRANCH_NOT_FOUND":
      // No action needed - logging handled by caller
      break;
  }
}

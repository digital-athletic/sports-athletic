import { TagGroups } from "@/constants/tagGroups";
import type { SkillTreesState } from "@/data/skillTreeRegistry";
import { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import { getRegionsForPreventionSkills } from "@/features/training/utils/preventionUtils";
import {
  getSkillTree,
  resolveBranchLevel,
} from "@/features/training/utils/skillTreeUtils";
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
  userLevel: string;
}

export type BranchLevelResult =
  | {
      type: "SAME_BRANCH";
      branchId: string;
      newLevel: number;
      exerciseId: string;
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
 * Find the current level for a branch from branchData, otherwise from the
 * entry level of the user's fitness level.
 */
export function findCurrentBranchLevel(
  branchId: string,
  branch: SkillBranchType,
  branchData: BranchDataMapType,
  userLevel: string,
): number {
  const userBranchData = branchData[branchId];
  if (userBranchData) {
    return userBranchData.level;
  }

  return (
    resolveBranchLevel(branch, userLevel) ??
    Math.min(...Object.keys(branch.levels).map(Number))
  );
}

/**
 * Walks from targetLevel in the earned direction to the first authored level
 * holding a different exercise, passing over missing levels and repeated exercises.
 * Returns null when the branch is exhausted in that direction.
 */
export function findNextExerciseInBranch(
  branch: SkillBranchType,
  currentExerciseId: string,
  targetLevel: number,
  levelUp: boolean,
): { exerciseId: string; level: number } | null {
  const authoredLevels = Object.keys(branch.levels ?? {}).map(Number);
  if (authoredLevels.length === 0) {
    return null;
  }

  const lowest = Math.min(...authoredLevels);
  const highest = Math.max(...authoredLevels);
  const step = levelUp ? 1 : -1;

  for (
    let level = targetLevel;
    level >= lowest && level <= highest;
    level += step
  ) {
    const exerciseId = branch.levels[level]?.exerciseId;
    if (exerciseId && exerciseId !== currentExerciseId) {
      return { exerciseId, level };
    }
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
  const { levelUp, branchId, exerciseId, skill, ageGroup, userLevel } = input;
  const { skillTrees, branchData, equipment, gender, exerciseList } = context;
  const { type, sectionIndex, weekday } = planContext;

  const levelChange = levelUp ? 1 : -1;

  // Find branch in skill tree
  const allSkillTrees = getSkillTree(skillTrees, "ALL", [], true);
  const branch = allSkillTrees[branchId];

  if (!branch) {
    return { type: "BRANCH_NOT_FOUND", branchId };
  }

  const branchLevel = findCurrentBranchLevel(
    branchId,
    branch,
    branchData,
    userLevel,
  );

  // Try to find next exercise in same branch
  const nextInBranch = findNextExerciseInBranch(
    branch,
    exerciseId,
    branchLevel + levelChange,
    levelUp,
  );

  if (nextInBranch) {
    return {
      type: "SAME_BRANCH",
      branchId,
      newLevel: nextInBranch.level,
      exerciseId: nextInBranch.exerciseId,
    };
  }

  // No next exercise found in same branch - look for equivalent branch (PLAN only)
  if (type !== "PLAN") {
    return { type: "NO_CHANGE", reason: "no_matching_branch_found", branchId };
  }

  // the substitute keeps the difficulty the athlete has reached
  const searchLevel = Math.max(1, branchLevel);
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
      [...branchIdsInUse, match.branchId],
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
  setBranchLevel: (branchId: string, level: number, exerciseId: string) => void;
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
      callbacks.setBranchLevel(
        result.branchId,
        result.newLevel,
        result.exerciseId,
      );
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

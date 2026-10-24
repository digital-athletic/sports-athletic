import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import {
  areaToRegion,
  getAreasFor,
} from "@/features/training/utils/exerciseUtils";
import { getTagValues } from "@/utils/tagUtils";
import type { GenerationInput } from "./generationInput";
import {
  type CandidateBranch,
  listBranchRemovals,
  readReplacementRegion,
  type RuleFamilyResult,
} from "./ruleFamily";

const keepBranchesOutsideSoreRegion = <T extends CandidateBranch>(
  branches: Record<string, T>,
  soreRegions: string[],
): Pick<RuleFamilyResult<T>, "keep" | "replace"> => {
  const keep: Record<string, T> = {};
  const replace: string[] = [];
  for (const [branchId, branch] of Object.entries(branches)) {
    const branchRegions = getTagValues(branch.tags ?? [], TagGroups.REGION);
    if (soreRegions.some((region) => branchRegions.includes(region))) {
      replace.push(...readReplacementRegion(branch.tags));
    } else {
      keep[branchId] = branch;
    }
  }
  return { keep, replace };
};

/**
 * Removes the branches of the sore region. Warm-up, cool-down, mobility and
 * foam roller skills ignore muscle soreness. Lower body soreness removes every
 * cardio branch with one LOWER_BODY request, and two sore areas throw.
 */
export const filterBranchesByMuscleSoreness = <T extends CandidateBranch>(
  branches: Record<string, T>,
  input: GenerationInput,
  skill: string,
): RuleFamilyResult<T> => {
  if (WorkoutConstants.IGNORE_SORENESS_SKILLS.includes(skill)) {
    return { keep: branches, removals: [], replace: [] };
  }
  const soreAreas = getAreasFor(input.muscleSoreness.map(({ tag }) => tag));
  const soreRegions = soreAreas.map(areaToRegion);
  if (soreAreas.length > 1) {
    // main's callers read this raw object, so it stays a plain object
    throw {
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: soreRegions,
    };
  }
  const { keep, replace } =
    skill.includes("CARDIO") && soreAreas.includes("lowerBody")
      ? { keep: {}, replace: ["LOWER_BODY"] }
      : keepBranchesOutsideSoreRegion(branches, soreRegions);
  return {
    keep,
    removals: listBranchRemovals(
      branches,
      keep,
      "muscleSoreness",
      () => soreRegions,
    ),
    replace,
  };
};

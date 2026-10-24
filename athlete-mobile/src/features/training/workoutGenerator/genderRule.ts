import { TagGroups } from "@/constants/tagGroups";
import { getUserGender } from "@/features/training/utils/userDataUtils";
import { getTagValues } from "@/utils/tagUtils";
import type { GenerationInput } from "./generationInput";
import {
  type CandidateBranch,
  listBranchRemovals,
  type RuleFamilyResult,
} from "./ruleFamily";

/**
 * Removes the branches tagged only for the other gender. An athlete without a
 * gender follows the female rules. Removal details hold the athlete's gender.
 */
export const filterBranchesByGender = <T extends CandidateBranch>(
  branches: Record<string, T>,
  { athlete }: GenerationInput,
): RuleFamilyResult<T> => {
  const gender = getUserGender(athlete);
  const keep: Record<string, T> = {};
  for (const [branchId, branch] of Object.entries(branches)) {
    const branchGenderTags = getTagValues(branch.tags ?? [], TagGroups.GENDER);
    if (branchGenderTags.length === 0 || branchGenderTags.includes(gender)) {
      keep[branchId] = branch;
    }
  }
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "gender", () => [gender]),
    replace: [],
  };
};

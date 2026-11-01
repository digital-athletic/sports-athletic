import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import {
  type CandidateBranch,
  keepBranches,
  listBranchRemovals,
  type RuleFamilyAthlete,
  type RuleFamilyResult,
} from "./ruleFamily";

/**
 * Removes the branches tagged only for the other gender. An athlete without a
 * gender follows the female rules. Removal details hold the athlete's gender.
 */
export const filterBranchesByGender = <T extends CandidateBranch>(
  branches: Record<string, T>,
  athlete: RuleFamilyAthlete,
): RuleFamilyResult<T> => {
  const gender = athlete.personalData?.gender ?? "FEMALE";
  const keep = keepBranches(branches, (branch) => {
    const branchGenderTags = getTagValues(branch.tags ?? [], TagGroups.GENDER);
    return branchGenderTags.length === 0 || branchGenderTags.includes(gender);
  });
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "gender", () => [gender]),
    replace: [],
  };
};

import { TagGroups } from "@/constants/tagGroups";
import {
  type AgeGroupTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { getTagValues } from "@/utils/tagUtils";
import {
  type CandidateBranch,
  keepBranches,
  listBranchRemovals,
  type RuleFamilyResult,
} from "./ruleFamily";

/**
 * Removes the branches tagged only for the other age group. Adolescents follow
 * the adult rules. Removal details hold the athlete's age group.
 */
export const filterBranchesByAgeGroup = <T extends CandidateBranch>(
  branches: Record<string, T>,
  ageGroup: AgeGroupTag,
): RuleFamilyResult<T> => {
  const ageTag =
    ageGroup === WorkoutConstants.AGE_GROUPS.CHILD
      ? WorkoutConstants.AGE_GROUPS.CHILD
      : WorkoutConstants.AGE_GROUPS.ADULT;
  const keep = keepBranches(branches, (branch) => {
    const branchAgeTags = getTagValues(branch.tags ?? [], TagGroups.AGE);
    return branchAgeTags.length === 0 || branchAgeTags.includes(ageTag);
  });
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "ageGroup", () => [ageGroup]),
    replace: [],
  };
};

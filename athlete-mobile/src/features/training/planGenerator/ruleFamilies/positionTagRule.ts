import {
  type CandidateBranch,
  keepBranches,
  listBranchRemovals,
  type RuleFamilyResult,
} from "@/features/training/workoutGenerator/ruleFamilies/ruleFamily";
import { hasOnlyPositionTags } from "@/utils/tagUtils";

/**
 * Removes the branches whose only tags are position tags. Selection picks a
 * goalkeeper exercise by its other tags, so one without other tags stays out.
 *
 * filterPositionTagOnlyBranches({ "1": <POSITION_GOAL>, "2": <POSITION_GOAL, REGION_LOWER_BODY> })
 * → { keep: { "2": ... }, removals: [{ branchId: "1", family: "positionTagOnly", details: [] }], replace: [] }
 */
export const filterPositionTagOnlyBranches = <T extends CandidateBranch>(
  branches: Record<string, T>,
): RuleFamilyResult<T> => {
  const keep = keepBranches(
    branches,
    (branch) => !hasOnlyPositionTags(branch.tags ?? []),
  );
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "positionTagOnly", () => []),
    replace: [],
  };
};

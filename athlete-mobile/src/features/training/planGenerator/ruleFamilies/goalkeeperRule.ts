import { TagGroups } from "@/constants/tagGroups";
import {
  type CandidateBranch,
  keepBranches,
  listBranchRemovals,
  type RuleFamilyResult,
} from "@/features/training/workoutGenerator/ruleFamilies/ruleFamily";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";
import type { PlayingPositionGroup } from "../stages/profileDerivation";

const GOALKEEPER_POSITION = "GOAL";

// The old generator lists five goalkeeper exercises by ID. The catalog tags
// those five and five more POSITION_GOAL: src/features/training/generators/PlanGenerator.ts#L2311-L2326
const isGoalkeeperBranch = (
  branch: CandidateBranch,
  exerciseCatalog: readonly Pick<ExerciseType, "id" | "tags">[],
): boolean => {
  const levels = branch.levels ?? branch.exercises ?? {};
  const tagLists = [
    branch.tags ?? [],
    ...Object.values(levels).map(
      ({ exerciseId }) =>
        exerciseCatalog.find(({ id }) => id === exerciseId)?.tags ?? [],
    ),
  ];
  return tagLists.some((tags) =>
    getTagValues(tags, TagGroups.POSITION).includes(GOALKEEPER_POSITION),
  );
};

/**
 * Removes the goalkeeper exercises for every playing position group except
 * the goalkeepers. A branch counts as a goalkeeper exercise when the branch or
 * the exercise of any level carries the tag POSITION_GOAL. Removal details
 * hold the athlete's playing position group.
 *
 * filterBranchesByGoalkeeperExclusion({ "1": <goalkeeper side step>, "2": <squat> }, "FIELD_PLAYER", catalog)
 * → { keep: { "2": ... }, removals: [{ branchId: "1", family: "goalkeeper", details: ["FIELD_PLAYER"] }], replace: [] }
 */
export const filterBranchesByGoalkeeperExclusion = <T extends CandidateBranch>(
  branches: Record<string, T>,
  playingPositionGroup: PlayingPositionGroup,
  exerciseCatalog: readonly Pick<ExerciseType, "id" | "tags">[],
): RuleFamilyResult<T> => {
  const keep = keepBranches(
    branches,
    (branch) =>
      playingPositionGroup === "GOALKEEPER" ||
      !isGoalkeeperBranch(branch, exerciseCatalog),
  );
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "goalkeeper", () => [
      playingPositionGroup,
    ]),
    replace: [],
  };
};

import { TagGroups } from "@/constants/tagGroups";
import { getBlocksFromPains } from "@/features/training/utils/painUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues, getUserTagValues } from "@/utils/tagUtils";
import type { GenerationInput } from "./generationInput";
import {
  type CandidateBranch,
  listBranchRemovals,
  type RuleFamilyResult,
} from "./ruleFamily";

const listBlockedRegions = ({ athlete }: GenerationInput): string[] =>
  getBlocksFromPains(
    getUserTagValues(athlete.workoutData?.tags, TagGroups.PAIN),
  );

/**
 * Reads the first blocked region, in pain order, that the branch's own block
 * tags name, or none.
 *
 * readFirstBlockingRegion(["BLOCK_KNEE", "BLOCK_SPINE"], ["SPINE", "KNEE"]) → ["SPINE"]
 */
const readFirstBlockingRegion = (
  tags: string[] = [],
  blockedRegions: string[],
): string[] => {
  const branchBlocks = getTagValues(tags, TagGroups.BLOCK);
  return blockedRegions
    .filter((region) => branchBlocks.includes(region))
    .slice(0, 1);
};

/**
 * Whether the branch tags or the tags of any level exercise block one of the
 * regions. An exercise ID missing from the catalog adds no tags.
 */
const isBranchBlockedOnAnyLevel = (
  branchTags: string[],
  levelExerciseIds: string[],
  exerciseCatalog: readonly Pick<ExerciseType, "id" | "tags">[],
  blockedRegions: string[],
): boolean => {
  if (blockedRegions.length === 0) return false;
  const tagLists = [
    branchTags,
    ...levelExerciseIds.map(
      (exerciseId) =>
        exerciseCatalog.find((exercise) => exercise.id === exerciseId)?.tags ??
        [],
    ),
  ];
  return tagLists.some((tags) =>
    getTagValues(tags, TagGroups.BLOCK).some((region) =>
      blockedRegions.includes(region),
    ),
  );
};

const keepBranches = <T extends CandidateBranch>(
  branches: Record<string, T>,
  isKept: (branch: T) => boolean,
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(branches).filter(([, branch]) => isKept(branch)),
  );

/**
 * Removes the branches whose own block tags name a region the athlete's pains
 * block. Each removal names the first such region in pain order.
 */
export const filterBranchesByPain = <T extends CandidateBranch>(
  branches: Record<string, T>,
  input: GenerationInput,
): RuleFamilyResult<T> => {
  const blockedRegions = listBlockedRegions(input);
  const keep = keepBranches(
    branches,
    (branch) =>
      readFirstBlockingRegion(branch.tags, blockedRegions).length === 0,
  );
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "pain", (branchId) =>
      readFirstBlockingRegion(branches[branchId].tags, blockedRegions),
    ),
    replace: [],
  };
};

/**
 * Removes the branches that block a pain region on the branch or on the
 * exercise of any level, so a level change never reaches a blocked exercise.
 * Removal details hold every region the athlete's pains block.
 */
export const filterBranchesByPainOnEveryLevel = <T extends CandidateBranch>(
  branches: Record<string, T>,
  input: GenerationInput,
): RuleFamilyResult<T> => {
  const blockedRegions = listBlockedRegions(input);
  const keep = keepBranches(branches, (branch) => {
    const levels = branch.levels ?? branch.exercises ?? {};
    // A level without an exercise ID matches no catalog exercise, so it adds no block tags
    return !isBranchBlockedOnAnyLevel(
      branch.tags ?? [],
      Object.values(levels).flatMap((level) => level.exerciseId ?? []),
      input.exerciseCatalog,
      blockedRegions,
    );
  });
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "pain", () => blockedRegions),
    replace: [],
  };
};

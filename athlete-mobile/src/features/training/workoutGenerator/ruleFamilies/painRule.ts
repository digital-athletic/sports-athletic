import { TagGroups } from "@/constants/tagGroups";
import { getBlocksFromPains } from "@/features/training/utils/painUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues, getUserTagValues } from "@/utils/tagUtils";
import type { GenerationInput } from "../generationInput/generationInput";
import {
  type CandidateBranch,
  keepBranches,
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
 * Lists the blocked regions, in pain order, that the branch tags or the tags
 * of any level exercise block. A level without an exercise ID or with an ID
 * missing from the catalog adds no tags.
 *
 * listRegionsBlockedOnAnyLevel({ tags: [], levels: { 1: { exerciseId: "901" } } }, catalog, ["KNEE", "SPINE"])
 * → ["KNEE"] when exercise 901 carries BLOCK_KNEE
 */
const listRegionsBlockedOnAnyLevel = (
  branch: CandidateBranch,
  exerciseCatalog: readonly Pick<ExerciseType, "id" | "tags">[],
  blockedRegions: string[],
): string[] => {
  const levels = branch.levels ?? branch.exercises ?? {};
  const tagLists = [
    branch.tags ?? [],
    ...Object.values(levels).flatMap(({ exerciseId }) =>
      exerciseId === undefined
        ? []
        : [exerciseCatalog.find(({ id }) => id === exerciseId)?.tags ?? []],
    ),
  ];
  const branchBlocks = tagLists.flatMap((tags) =>
    getTagValues(tags, TagGroups.BLOCK),
  );
  return blockedRegions.filter((region) => branchBlocks.includes(region));
};

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
 * Each removal names the regions that block that branch, in pain order.
 */
export const filterBranchesByPainOnEveryLevel = <T extends CandidateBranch>(
  branches: Record<string, T>,
  input: GenerationInput,
): RuleFamilyResult<T> => {
  const blockedRegions = listBlockedRegions(input);
  const listBranchBlockingRegions = (branch: T): string[] =>
    listRegionsBlockedOnAnyLevel(branch, input.exerciseCatalog, blockedRegions);
  const keep = keepBranches(
    branches,
    (branch) => listBranchBlockingRegions(branch).length === 0,
  );
  return {
    keep,
    removals: listBranchRemovals(branches, keep, "pain", (branchId) =>
      listBranchBlockingRegions(branches[branchId]),
    ),
    replace: [],
  };
};

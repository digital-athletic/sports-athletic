import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import { filterBranchesByTags } from "../workoutGenerator/blockHandlers/picks/branchTagFilter";
import { filterReplacementBranches } from "../workoutGenerator/blockHandlers/library/branchReplacement";
import { resolveBranchExerciseId } from "../workoutGenerator/blockHandlers/library/branchResolution";
import { selectReplacementSkillTree } from "../workoutGenerator/blockHandlers/library/replacementSkillTree";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { Block } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { WorkoutInput } from "../workoutGenerator/stages/workoutSetup";

const MAX_SWAP_ALTERNATIVES = 3;

// The penalties of automatic branch substitution
const OTHER_REGION_FACTOR = 0.5;
const OTHER_DIRECTION_FACTOR = 0.8;

interface SwapAlternativesRequest {
  skill: string;
  branchId: string;
  /** Branches of the session besides the swapped one. */
  usedBranchIds: readonly string[];
  /** Exercises of the session besides the swapped one. */
  usedExerciseIds: readonly string[];
}

const sharesTag = (
  original: string[],
  candidate: string[],
  group: TagGroups,
): boolean => {
  const originalValues = getTagValues(original, group);
  return (
    originalValues.length === 0 ||
    getTagValues(candidate, group).some((value) =>
      originalValues.includes(value),
    )
  );
};

const scoreSimilarity = (original: string[], candidate: string[]): number =>
  (sharesTag(original, candidate, TagGroups.REGION) ? 1 : OTHER_REGION_FACTOR) *
  (sharesTag(original, candidate, TagGroups.EXERCISE_DIRECTION)
    ? 1
    : OTHER_DIRECTION_FACTOR);

const readSides = (tags: string[]): string =>
  [...getTagValues(tags, TagGroups.SIDE)].sort().join();

interface RankRequest {
  branchId: string;
  originalTags: string[];
  usedBranchIds: readonly string[];
  usedExerciseIds: readonly string[];
}

const rankAlternatives = (
  candidates: SkillTreeType,
  { branchId, originalTags, usedBranchIds, usedExerciseIds }: RankRequest,
  input: WorkoutInput,
): StoredBranch[] => {
  const sides = readSides(originalTags);
  return Object.entries(candidates)
    .filter(([candidateId, branch]) => {
      if (candidateId === branchId || usedBranchIds.includes(candidateId)) {
        return false;
      }
      const exerciseId = resolveBranchExerciseId(
        branch,
        input.athleteLevel,
        input.exerciseData.branchData[candidateId],
      );
      return (
        exerciseId !== null &&
        !usedExerciseIds.includes(exerciseId) &&
        readSides(branch.tags ?? []) === sides
      );
    })
    .map(([candidateId, branch]) => ({
      stored: { branchId: candidateId, branch },
      score: scoreSimilarity(originalTags, branch.tags ?? []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SWAP_ALTERNATIVES)
    .map(({ stored }) => stored);
};

/**
 * Lists up to three branches that may replace a branch of a plan training:
 * branches of the same skill tree that pass the replacement filters, have the
 * original's side setting and add no branch or exercise that is already in
 * the session.
 * The closest branch by body region and movement direction comes first.
 */
export const listSwapAlternatives = (
  { skill, branchId, usedBranchIds, usedExerciseIds }: SwapAlternativesRequest,
  input: WorkoutInput,
): StoredBranch[] => {
  const skillTree = selectReplacementSkillTree(skill, 1, input);
  if (!Object.hasOwn(skillTree, branchId)) return [];
  return rankAlternatives(
    filterReplacementBranches(skillTree, input, skill),
    {
      branchId,
      originalTags: skillTree[branchId].tags ?? [],
      usedBranchIds,
      usedExerciseIds,
    },
    input,
  );
};

interface PickSwapAlternativesRequest {
  branchId: string;
  usedBranchIds: readonly string[];
  usedExerciseIds: readonly string[];
}

/**
 * Lists up to three branches that may replace a branch a picks block drew:
 * branches of the block pool that match a pick the original matches, or the
 * whole block pool when the original matches no pick. The ranking and the
 * filters are those of listSwapAlternatives.
 */
export const listPickSwapAlternatives = (
  { branchId, usedBranchIds, usedExerciseIds }: PickSwapAlternativesRequest,
  block: Block,
  input: WorkoutInput,
): StoredBranch[] => {
  const resolved = input.picksWorkout.blocks.get(block);
  if (resolved === undefined) return [];
  const blockPool = Object.fromEntries(
    Object.entries(input.picksWorkout.pool).filter(([id]) =>
      Object.hasOwn(resolved.pool, id),
    ),
  );
  if (!Object.hasOwn(blockPool, branchId)) return [];
  const pickPools = resolved.picks
    .map(({ tags }) => filterBranchesByTags(blockPool, tags))
    .filter((pickPool) => Object.hasOwn(pickPool, branchId));
  const candidates =
    pickPools.length === 0
      ? blockPool
      : Object.fromEntries(
          Object.entries(blockPool).filter(([id]) =>
            pickPools.some((pickPool) => Object.hasOwn(pickPool, id)),
          ),
        );
  return rankAlternatives(
    candidates,
    {
      branchId,
      originalTags: blockPool[branchId].tags ?? [],
      usedBranchIds,
      usedExerciseIds,
    },
    input,
  );
};

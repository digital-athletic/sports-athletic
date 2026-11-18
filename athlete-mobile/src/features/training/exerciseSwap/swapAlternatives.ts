import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import { filterBranchesByTags } from "../workoutGenerator/blockHandlers/picks/branchTagFilter";
import { intersectBlockPool } from "../workoutGenerator/blockHandlers/picks/picksDraw";
import { filterReplacementBranches } from "../workoutGenerator/blockHandlers/library/branchReplacement";
import { resolveBranchExerciseId } from "../workoutGenerator/blockHandlers/library/branchResolution";
import { selectReplacementSkillTree } from "../workoutGenerator/blockHandlers/library/replacementSkillTree";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { Block } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { WorkoutInput } from "../workoutGenerator/stages/workoutSetup";

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

type PickSwapAlternativesRequest = Omit<SwapAlternativesRequest, "skill">;

interface RankRequest extends PickSwapAlternativesRequest {
  originalTags: string[];
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
    .map(({ stored }) => stored);
};

/**
 * Lists every alternative from the skill tree of the branch, closest by
 * body region and movement direction first. An alternative passes the
 * replacement filters, matches the original's sides and repeats no session entry.
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

/**
 * Lists every alternative for a branch drawn by a picks block: block
 * pool branches that match one of the original's picks, else the whole block
 * pool. The ranking and the checks for sides and repeats follow listSwapAlternatives.
 */
export const listPickSwapAlternatives = (
  { branchId, usedBranchIds, usedExerciseIds }: PickSwapAlternativesRequest,
  block: Block,
  input: WorkoutInput,
): StoredBranch[] => {
  const resolved = input.picksWorkout.blocks.get(block);
  if (resolved === undefined) return [];
  const blockPool = intersectBlockPool(input.picksWorkout.pool, resolved.pool);
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

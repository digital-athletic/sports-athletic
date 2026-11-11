import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import { filterReplacementBranches } from "../workoutGenerator/blockHandlers/library/branchReplacement";
import { resolveBranchExerciseId } from "../workoutGenerator/blockHandlers/library/branchResolution";
import { selectReplacementSkillTree } from "../workoutGenerator/blockHandlers/library/replacementSkillTree";
import type { StoredBranch } from "../workoutGenerator/blockHandlers/branches/storedBranchLookup";
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
  const originalTags = skillTree[branchId].tags ?? [];
  const sides = readSides(originalTags);

  return Object.entries(filterReplacementBranches(skillTree, input, skill))
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

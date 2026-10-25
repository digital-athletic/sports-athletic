import type { BlockResult, BranchesBlock } from "./blockWalk";
import { resolveBranchExercise } from "./branchResolution";
import type { WorkoutInput } from "./workoutSetup";

const CARDIO_REPLACEMENT_SKILL = "CARDIO_5";
const CARDIO_REPLACEMENT_BRANCH_ID = "576";
const CARDIO_REPLACEMENT_MAX_SECONDS = 20 * 60;

/**
 * Swaps a cardio block that needs a replacement for the CARDIO_5 run: one
 * branch, at most 20 minutes. Throws when the CARDIO_5 tree misses the branch.
 */
export const replaceCardioBlock = (
  block: BranchesBlock,
  input: WorkoutInput,
): BlockResult => {
  const indexed = input.branchLookupIndex.get(CARDIO_REPLACEMENT_BRANCH_ID);
  if (indexed?.skillTreeName !== CARDIO_REPLACEMENT_SKILL) {
    throw { type: "NO_EXERCISES", subtype: "CARDIO_5_MISSING", params: [] };
  }
  const { levels, tags } = indexed.branch;
  const exercise = resolveBranchExercise(
    { levels, tags },
    input.athleteLevel,
    input.exerciseCatalog,
    input.exerciseData.branchData[CARDIO_REPLACEMENT_BRANCH_ID] ?? null,
  );
  return {
    status: "filled",
    block: {
      ...block,
      skill: CARDIO_REPLACEMENT_SKILL,
      branches: [CARDIO_REPLACEMENT_BRANCH_ID],
      ...(block.duration !== undefined && {
        duration: Math.min(block.duration, CARDIO_REPLACEMENT_MAX_SECONDS),
      }),
    },
    exercises: [
      {
        branchId: CARDIO_REPLACEMENT_BRANCH_ID,
        branchTags: exercise ? exercise.tags : tags,
        exerciseId: exercise?.id ?? "-1",
      },
    ],
    usedBranchIds: [CARDIO_REPLACEMENT_BRANCH_ID],
    swappedFromSkill: block.skill,
  };
};

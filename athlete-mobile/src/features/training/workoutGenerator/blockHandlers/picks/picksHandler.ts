import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type {
  BlockHandler,
  BlockHandlerRegistry,
  BlockResult,
} from "../../stages/blockWalk";
import type { WorkoutInput } from "../../stages/workoutSetup";
import { resolveBranchExerciseId } from "../library/branchResolution";
import { drawPicksBlock } from "./picksDraw";
import { readResolvedPicksBlock } from "./picksWorkoutRules";

// A branches block can train an exercise through a branch the picks pool
// lacks, so the draw's own check by used branch would miss it.
const dropTrainedExercises = (
  pool: SkillTreeType,
  earlierResults: readonly BlockResult[],
  input: WorkoutInput,
): SkillTreeType => {
  const trainedExerciseIds = new Set(
    earlierResults.flatMap((result) =>
      result.status === "filled"
        ? result.exercises.map(({ exerciseId }) => exerciseId)
        : [],
    ),
  );
  const { branchData } = input.exerciseData;
  return Object.fromEntries(
    Object.entries(pool).filter(([branchId, branch]) => {
      const exerciseId = resolveBranchExerciseId(
        branch,
        input.athleteLevel,
        Object.hasOwn(branchData, branchId) ? branchData[branchId] : undefined,
      );
      return exerciseId === null || !trainedExerciseIds.has(exerciseId);
    }),
  );
};

/**
 * Draws the branches of a picks block from its pool after the picks workout
 * rules, skipping the branches and exercises earlier blocks used. A block that
 * draws nothing ends empty without a reason, since short workouts record no
 * error for it.
 */
export const handlePicksBlock: BlockHandler<"picks"> = (
  block,
  input,
  usedBranches,
  earlierResults = [],
) => {
  const { pool, draw } = input.picksWorkout;
  const drawn = drawPicksBlock(
    readResolvedPicksBlock(input.picksWorkout, block),
    {
      pool: dropTrainedExercises(pool, earlierResults, input),
      draw,
      usedBranchIds: [...usedBranches],
    },
  );
  return drawn.branches.length > 0
    ? {
        status: "filled",
        block,
        exercises: drawn.branches,
        usedBranchIds: drawn.usedBranchIds,
      }
    : {
        status: "empty",
        block,
        reason: undefined,
        usedBranchIds: drawn.usedBranchIds,
      };
};

export const PICKS_BLOCK_HANDLER: BlockHandlerRegistry["picks"] = {
  usedBranchScope: "workout",
  handleBlock: handlePicksBlock,
};

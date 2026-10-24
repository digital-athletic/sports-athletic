import type { BlockHandler, BlockHandlerRegistry } from "./blockWalk";
import { drawPicksBlock } from "./picksDraw";
import { readResolvedPicksBlock } from "./picksWorkoutRules";

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
) => {
  const { pool, draw } = input.picksWorkout;
  const drawn = drawPicksBlock(
    readResolvedPicksBlock(input.picksWorkout, block),
    { pool, draw, usedBranchIds: [...usedBranches] },
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

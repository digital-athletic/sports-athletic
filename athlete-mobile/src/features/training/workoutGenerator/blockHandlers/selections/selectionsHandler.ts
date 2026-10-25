import type {
  BlockHandler,
  BlockHandlerRegistry,
} from "../../stages/blockWalk";
import { drawSelectionsBlock } from "./selectionsDraw";
import { readResolvedSelectionsBlock } from "./selectionsWorkoutRules";

/**
 * Draws the branches of a selections block from its pool after the selections
 * workout rules, skipping the branches and exercises earlier blocks used. A
 * block that draws nothing ends empty without a reason, since short workouts
 * record no error for it.
 */
export const handleSelectionsBlock: BlockHandler<"picks"> = (
  block,
  input,
  usedBranches,
) => {
  const { pool, draw } = input.selectionsWorkout;
  const drawn = drawSelectionsBlock(
    readResolvedSelectionsBlock(input.selectionsWorkout, block),
    {
      pool,
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

export const SELECTIONS_BLOCK_HANDLER: BlockHandlerRegistry["picks"] = {
  usedBranchScope: "workout",
  handleBlock: handleSelectionsBlock,
};

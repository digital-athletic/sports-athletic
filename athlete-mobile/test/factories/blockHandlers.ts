import type {
  BlockHandlerRegistry,
  BlockResult,
  BlockWalkContext,
} from "@/features/training/workoutGenerator/stages/blockWalk";
import type { WorkoutInput } from "@/features/training/workoutGenerator/stages/workoutSetup";
import type { WorkoutBlock } from "@/schemas/strengthTestTemplate.schema";
import { generateEmptyBlockResult } from "./blockResult";

type HandleAnyBlock = (
  block: WorkoutBlock,
  input: WorkoutInput,
  usedBranches: ReadonlySet<string>,
  walk?: BlockWalkContext,
) => BlockResult;

/**
 * Builds a block handler registry whose four handlers are the same function,
 * by default one that leaves every block empty. Picks, duration and exercises
 * blocks share their used branches across the workout, branches blocks start
 * empty. The overrides replace the handler of one kind.
 *
 * generateHandlerRegistry(handleBlock, { picks: PICKS_BLOCK_HANDLER })
 * → { picks: PICKS_BLOCK_HANDLER,
 *     branches: { usedBranchScope: "block", handleBlock },
 *     duration: { usedBranchScope: "workout", handleBlock },
 *     exercises: { usedBranchScope: "workout", handleBlock } }
 */
export const generateHandlerRegistry = (
  handleBlock: HandleAnyBlock = (block) => generateEmptyBlockResult(block),
  overrides: Partial<BlockHandlerRegistry> = {},
): BlockHandlerRegistry => ({
  picks: { usedBranchScope: "workout", handleBlock },
  branches: { usedBranchScope: "block", handleBlock },
  duration: { usedBranchScope: "workout", handleBlock },
  exercises: { usedBranchScope: "workout", handleBlock },
  ...overrides,
});

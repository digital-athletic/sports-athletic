import type {
  BlockHandlerRegistry,
  BlockResult,
} from "@/features/training/workoutGenerator/stages/blockWalk";
import type { WorkoutInput } from "@/features/training/workoutGenerator/stages/workoutSetup";
import type { Block } from "@/schemas/aiwl.schema";
import { generateEmptyBlockResult } from "./blockResult";

type HandleAnyBlock = (
  block: Block,
  input: WorkoutInput,
  usedBranches: ReadonlySet<string>,
  earlierResults?: readonly BlockResult[],
) => BlockResult;

/**
 * Builds a block handler registry whose three handlers are the same function,
 * by default one that leaves every block empty. Selections and minutes blocks
 * share their used branches across the workout, branches blocks start empty.
 * The overrides replace the handler of one kind.
 *
 * generateHandlerRegistry(handleBlock, { picks: SELECTIONS_BLOCK_HANDLER })
 * → { picks: SELECTIONS_BLOCK_HANDLER,
 *     branches: { usedBranchScope: "block", handleBlock },
 *     duration: { usedBranchScope: "workout", handleBlock } }
 */
export const generateHandlerRegistry = (
  handleBlock: HandleAnyBlock = (block) => generateEmptyBlockResult(block),
  overrides: Partial<BlockHandlerRegistry> = {},
): BlockHandlerRegistry => ({
  picks: { usedBranchScope: "workout", handleBlock },
  branches: { usedBranchScope: "block", handleBlock },
  duration: { usedBranchScope: "workout", handleBlock },
  ...overrides,
});

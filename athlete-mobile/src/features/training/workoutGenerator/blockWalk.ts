import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block, Template } from "@/schemas/aiwl.schema";
import type { WorkoutInput } from "./workoutSetup";

export type BlockKind = Block["kind"];

// A handler may return a changed block, for example a blocked cardio skill
// swapped for CARDIO_5. "filled" means the block kept a branch; an exercise
// ID of "-1" still counts, and the set list builder drops it. An empty block
// has no reason where the old generator records no error for the skill.
// usedBranchIds lists every branch a picks block drew, kept or not, and the
// branches a branches block resolved.
export type BlockResult =
  | {
      status: "filled";
      block: Block;
      exercises: BranchExerciseReference[];
      usedBranchIds: string[];
    }
  | {
      status: "empty";
      block: Block;
      reason: GeneratorError | undefined;
      usedBranchIds: string[];
    };

export type BlockHandler<K extends BlockKind> = (
  block: Extract<Block, { kind: K }>,
  input: WorkoutInput,
  usedBranches: ReadonlySet<string>,
) => BlockResult;

// "workout" hands each block the branches every earlier block of that scope
// used; "block" hands each block an empty set, as the old training day does.
export type UsedBranchScope = "workout" | "block";

export type BlockHandlerRegistry = {
  readonly [K in BlockKind]: {
    readonly usedBranchScope: UsedBranchScope;
    readonly handleBlock: BlockHandler<K>;
  };
};

const handleBlockByKind = (
  block: Block,
  input: WorkoutInput,
  usedBranches: ReadonlySet<string>,
  handlers: BlockHandlerRegistry,
): BlockResult => {
  switch (block.kind) {
    case "picks":
      return handlers.picks.handleBlock(block, input, usedBranches);
    case "branches":
      return handlers.branches.handleBlock(block, input, usedBranches);
    case "duration":
      return handlers.duration.handleBlock(block, input, usedBranches);
  }
};

/**
 * Visits the blocks in template order, so the handlers draw from the random
 * source in that order, and returns one result per block.
 */
export const walkTemplateBlocks = (
  template: Template,
  input: WorkoutInput,
  handlers: BlockHandlerRegistry,
): BlockResult[] => {
  let workoutUsedBranches: ReadonlySet<string> = new Set();
  const results: BlockResult[] = [];
  for (const block of template.blocks) {
    const isWorkoutScope = handlers[block.kind].usedBranchScope === "workout";
    const result = handleBlockByKind(
      block,
      input,
      isWorkoutScope ? workoutUsedBranches : new Set(),
      handlers,
    );
    if (isWorkoutScope) {
      workoutUsedBranches = new Set([
        ...workoutUsedBranches,
        ...result.usedBranchIds,
      ]);
    }
    results.push(result);
  }
  return results;
};

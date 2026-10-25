import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block, Template } from "@/schemas/aiwl.schema";
import type { WorkoutInput } from "./workoutSetup";

export type BlockKind = Block["kind"];

export type BranchesBlock = Extract<Block, { kind: "branches" }>;

/**
 * The part of a workout the interpreter runs: a workout document, which passed
 * TemplateSchema, or a stored day workout, which the language rules do not bind.
 */
export type InterpretedWorkout = Pick<Template, "id" | "blocks">;

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
      /** The skill of the stored block, set when a handler swapped the skill. */
      swappedFromSkill?: string;
    }
  | {
      status: "empty";
      block: Block;
      reason: GeneratorError | undefined;
      usedBranchIds: string[];
    };

// earlierResults holds the results of the blocks before this one, in template
// order, for a rule that reads what an earlier block wrote. The walk always
// passes it; a handler that ignores it may leave it out.
export type BlockHandler<K extends BlockKind> = (
  block: Extract<Block, { kind: K }>,
  input: WorkoutInput,
  usedBranches: ReadonlySet<string>,
  earlierResults?: readonly BlockResult[],
) => BlockResult;

// "workout" hands each block the branches every earlier block used, whatever
// its scope; "block" hands each block an empty set, as the old training day does.
export type UsedBranchScope = "workout" | "block";

export type BlockHandlerRegistry = {
  readonly [K in BlockKind]: {
    readonly usedBranchScope: UsedBranchScope;
    readonly handleBlock: BlockHandler<K>;
  };
};

interface BlockContext {
  input: WorkoutInput;
  usedBranches: ReadonlySet<string>;
  earlierResults: readonly BlockResult[];
}

const handleBlockByKind = (
  block: Block,
  handlers: BlockHandlerRegistry,
  { input, usedBranches, earlierResults }: BlockContext,
): BlockResult => {
  switch (block.kind) {
    case "picks":
      return handlers.picks.handleBlock(
        block,
        input,
        usedBranches,
        earlierResults,
      );
    case "branches":
      return handlers.branches.handleBlock(
        block,
        input,
        usedBranches,
        earlierResults,
      );
    case "duration":
      return handlers.duration.handleBlock(
        block,
        input,
        usedBranches,
        earlierResults,
      );
  }
};

/**
 * Visits the blocks in template order, so the handlers draw from the random
 * source in that order, and returns one result per block.
 */
export const walkTemplateBlocks = (
  template: InterpretedWorkout,
  input: WorkoutInput,
  handlers: BlockHandlerRegistry,
): BlockResult[] => {
  let workoutUsedBranches: ReadonlySet<string> = new Set();
  const results: BlockResult[] = [];
  for (const block of template.blocks) {
    const isWorkoutScope = handlers[block.kind].usedBranchScope === "workout";
    const result = handleBlockByKind(block, handlers, {
      input,
      usedBranches: isWorkoutScope ? workoutUsedBranches : new Set(),
      earlierResults: results,
    });
    workoutUsedBranches = new Set([
      ...workoutUsedBranches,
      ...result.usedBranchIds,
    ]);
    results.push(result);
  }
  return results;
};

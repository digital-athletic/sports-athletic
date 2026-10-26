import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block } from "@/schemas/aiwl.schema";
import type {
  ExercisesBlock,
  WorkoutBlock,
} from "@/schemas/strengthTestTemplate.schema";
import type { WorkoutInput } from "./workoutSetup";

export type BlockKind = WorkoutBlock["kind"];

export type BranchesBlock = Extract<Block, { kind: "branches" }>;

/** A block whose handler selects branches: every AIWL block kind. */
export type BranchSelectingBlock = Block;

/**
 * An exercise a workout prescribes by catalog ID. It belongs to no branch, so
 * it carries no branch tags and moves no branch progression.
 */
export type PrescribedExerciseReference = {
  source: "exercise";
  exerciseId: string;
};

/**
 * The part of a workout the interpreter runs: a workout document, which passed
 * TemplateSchema or StrengthTestTemplateSchema, or a stored day workout, which
 * the language rules do not bind.
 */
export interface InterpretedWorkout {
  readonly id: string;
  readonly blocks: readonly WorkoutBlock[];
}

// A handler may return a changed block, for example a blocked cardio skill
// swapped for CARDIO_5. "filled" means the block kept a branch; an exercise
// ID of "-1" still counts, and the set list builder drops it. An empty block
// has no reason where the old generator records no error for the skill.
// usedBranchIds lists every branch a picks block drew, kept or not, and the
// branches a branches block resolved. "prescribed" holds the catalog exercises
// an exercises block lists, in list order, and uses no branch.
export type BlockResult =
  | {
      status: "filled";
      block: BranchSelectingBlock;
      exercises: BranchExerciseReference[];
      usedBranchIds: string[];
      /** The skill of the stored block, set when a handler swapped the skill. */
      swappedFromSkill?: string;
    }
  | {
      status: "prescribed";
      block: ExercisesBlock;
      exercises: PrescribedExerciseReference[];
      usedBranchIds: string[];
    }
  | {
      status: "empty";
      block: WorkoutBlock;
      reason: GeneratorError | undefined;
      usedBranchIds: string[];
    };

// earlierResults holds the results of the blocks before this one, in template
// order, for a rule that reads what an earlier block wrote. blockPath,
// "<template id>.blocks[<index>]", names the block in errors.
export interface BlockWalkContext {
  readonly earlierResults: readonly BlockResult[];
  readonly blockPath: string;
}

// The walk always passes the context; a handler that ignores it may leave it out.
export type BlockHandler<K extends BlockKind> = (
  block: Extract<WorkoutBlock, { kind: K }>,
  input: WorkoutInput,
  usedBranches: ReadonlySet<string>,
  walk?: BlockWalkContext,
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
  walk: BlockWalkContext;
}

const handleBlockByKind = (
  block: WorkoutBlock,
  handlers: BlockHandlerRegistry,
  { input, usedBranches, walk }: BlockContext,
): BlockResult => {
  switch (block.kind) {
    case "picks":
      return handlers.picks.handleBlock(block, input, usedBranches, walk);
    case "branches":
      return handlers.branches.handleBlock(block, input, usedBranches, walk);
    case "duration":
      return handlers.duration.handleBlock(block, input, usedBranches, walk);
    case "exercises":
      return handlers.exercises.handleBlock(block, input, usedBranches, walk);
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
  for (const [index, block] of template.blocks.entries()) {
    const isWorkoutScope = handlers[block.kind].usedBranchScope === "workout";
    const result = handleBlockByKind(block, handlers, {
      input,
      usedBranches: isWorkoutScope ? workoutUsedBranches : new Set(),
      walk: {
        earlierResults: results,
        blockPath: `${template.id}.blocks[${index}]`,
      },
    });
    workoutUsedBranches = new Set([
      ...workoutUsedBranches,
      ...result.usedBranchIds,
    ]);
    results.push(result);
  }
  return results;
};

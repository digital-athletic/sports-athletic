import { WorkoutConstants } from "@/constants/workoutConstants";
import type { BlockResult } from "./blockWalk";

export type FilledBlockResult = Extract<BlockResult, { status: "filled" }>;

export interface WorkoutFinishRules {
  // "section" builds the skills in SECTION_ORDER, "template" in block order.
  readonly blockOrder: "template" | "section";
  // "throwFirstReason" throws the first empty block's reason in template
  // order when the set list stays empty; "returnEmpty" never throws.
  readonly emptyWorkout: "throwFirstReason" | "returnEmpty";
}

export const TRAINING_DAY_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "section",
  emptyWorkout: "throwFirstReason",
};

// The old short workout throws only in its pool rules, never after the draws.
export const SHORT_WORKOUT_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "template",
  emptyWorkout: "returnEmpty",
};

export type SetListBuilder<TEntry> = (blocks: FilledBlockResult[]) => TEntry[];

export interface FinishedWorkout<TEntry> {
  blocks: FilledBlockResult[];
  setList: TEntry[];
}

const sortBlockResultsBySectionOrder = (
  results: FilledBlockResult[],
): FilledBlockResult[] =>
  [...results].sort(
    (a, b) =>
      WorkoutConstants.SECTION_ORDER.indexOf(a.block.skill) -
      WorkoutConstants.SECTION_ORDER.indexOf(b.block.skill),
  );

/**
 * Builds the set list from the filled blocks in build order. The empty check
 * reads the built set list, as the old generator does, because the builder
 * drops branches without a catalog exercise.
 */
export const finishWorkout = <TEntry>(
  results: readonly BlockResult[],
  rules: WorkoutFinishRules,
  buildSetList: SetListBuilder<TEntry>,
): FinishedWorkout<TEntry> => {
  const filledBlocks = results.filter(
    (result): result is FilledBlockResult => result.status === "filled",
  );
  const blocks =
    rules.blockOrder === "section"
      ? sortBlockResultsBySectionOrder(filledBlocks)
      : filledBlocks;
  const setList = buildSetList(blocks);
  if (setList.length === 0 && rules.emptyWorkout === "throwFirstReason") {
    for (const result of results) {
      if (result.status === "empty" && result.reason) throw result.reason;
    }
  }
  return { blocks, setList };
};

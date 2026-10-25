import { WorkoutConstants } from "@/constants/workoutConstants";
import type { BlockResult } from "./blockWalk";

export type FilledBlockResult = Extract<BlockResult, { status: "filled" }>;

export interface WorkoutFinishRules {
  // "section" builds the skills in SECTION_ORDER, "template" in block order.
  readonly blockOrder: "template" | "section";
  // "throwFirstReason" throws the first empty block's reason in template
  // order when the set list stays empty; "returnEmpty" never throws.
  readonly emptyWorkout: "throwFirstReason" | "returnEmpty";
  // "lastWins" keeps one block per skill, the last one in template order, as a
  // stored day holds one entry per skill; "keepAll" builds every block.
  readonly sameSkillBlocks: "keepAll" | "lastWins";
}

export const TRAINING_DAY_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "section",
  emptyWorkout: "throwFirstReason",
  sameSkillBlocks: "lastWins",
};

// The old short workout throws only in its pool rules, never after the draws.
export const SHORT_WORKOUT_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "template",
  emptyWorkout: "returnEmpty",
  sameSkillBlocks: "keepAll",
};

// Takes the filled blocks in build order and every block result in template
// order, for rules that depend on an empty block.
export type SetListBuilder<TEntry> = (
  blocks: FilledBlockResult[],
  results: readonly BlockResult[],
) => TEntry[];

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

// An empty block counts: it replaces an earlier filled block of its skill.
const listLastResultPerSkill = (
  results: readonly BlockResult[],
): BlockResult[] =>
  results.filter(
    (result, index) =>
      !results
        .slice(index + 1)
        .some((later) => later.block.skill === result.block.skill),
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
  const filledBlocks = (
    rules.sameSkillBlocks === "lastWins"
      ? listLastResultPerSkill(results)
      : results
  ).filter((result): result is FilledBlockResult => result.status === "filled");
  const blocks =
    rules.blockOrder === "section"
      ? sortBlockResultsBySectionOrder(filledBlocks)
      : filledBlocks;
  const setList = buildSetList(blocks, results);
  if (setList.length === 0 && rules.emptyWorkout === "throwFirstReason") {
    for (const result of results) {
      if (result.status === "empty" && result.reason) throw result.reason;
    }
  }
  return { blocks, setList };
};

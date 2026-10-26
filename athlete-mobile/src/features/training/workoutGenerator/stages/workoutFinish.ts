import { WorkoutConstants } from "@/constants/workoutConstants";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { BlockResult } from "./blockWalk";

export type FilledBlockResult = Extract<BlockResult, { status: "filled" }>;
/** A block result the set list builds: branch selected or prescribed. */
export type BuiltBlockResult = Exclude<BlockResult, { status: "empty" }>;

export interface WorkoutFinishRules {
  // "section" builds the skills in SECTION_ORDER, "template" in block order.
  readonly blockOrder: "template" | "section";
  // "throwFirstReason" throws the first empty block's reason in template
  // order when the set list stays empty; "returnEmpty" never throws.
  readonly emptyWorkout: "throwFirstReason" | "returnEmpty";
  // "every" throws for the first empty block in template order, with its
  // reason, so a source whose blocks belong together never returns a part of
  // it; "none" builds the blocks that are not empty.
  readonly requiredBlocks: "every" | "none";
  // "lastWins" keeps one branch selecting block per skill, the last one in
  // template order, as a stored day holds one entry per skill, and keeps every
  // prescribed block; "keepAll" builds every block.
  readonly sameSkillBlocks: "keepAll" | "lastWins";
}

export const TRAINING_DAY_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "section",
  emptyWorkout: "throwFirstReason",
  requiredBlocks: "none",
  sameSkillBlocks: "lastWins",
};

// The old short workout throws only in its pool rules, never after the draws.
export const SHORT_WORKOUT_FINISH_RULES: WorkoutFinishRules = {
  blockOrder: "template",
  emptyWorkout: "returnEmpty",
  requiredBlocks: "none",
  sameSkillBlocks: "keepAll",
};

// Takes the built blocks in build order and every block result in template
// order, for rules that depend on an empty block.
export type SetListBuilder<TEntry> = (
  blocks: BuiltBlockResult[],
  results: readonly BlockResult[],
) => TEntry[];

export interface FinishedWorkout<TEntry> {
  blocks: BuiltBlockResult[];
  setList: TEntry[];
}

// A prescribed block keeps its template slot; the filled blocks fill the
// other slots in section order, so no source order moves a prescribed list.
const sortBlockResultsBySectionOrder = (
  results: BuiltBlockResult[],
): BuiltBlockResult[] => {
  const sortedFilled = results
    .filter((result) => result.status === "filled")
    .sort(
      (a, b) =>
        WorkoutConstants.SECTION_ORDER.indexOf(a.block.skill) -
        WorkoutConstants.SECTION_ORDER.indexOf(b.block.skill),
    );
  let nextFilled = 0;
  return results.map((result) =>
    result.status === "prescribed" ? result : sortedFilled[nextFilled++],
  );
};

// An empty block counts: it replaces an earlier filled block of its skill. A
// prescribed block neither replaces a block nor gets replaced, so the rule
// never drops an exercise the template prescribes.
const listLastResultPerSkill = (
  results: readonly BlockResult[],
): BlockResult[] =>
  results.filter(
    (result, index) =>
      result.status === "prescribed" ||
      !results
        .slice(index + 1)
        .some(
          (later) =>
            later.status !== "prescribed" &&
            later.block.skill === result.block.skill,
        ),
  );

// Some handlers still end empty without a reason, so the rule names the skill.
const requireEveryBlock = (results: readonly BlockResult[]): void => {
  const empty = results.find((result) => result.status === "empty");
  if (empty?.status !== "empty") return;
  throw (
    empty.reason ??
    ({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: [empty.block.skill],
    } satisfies GeneratorError)
  );
};

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
  if (rules.requiredBlocks === "every") requireEveryBlock(results);
  const filledBlocks = (
    rules.sameSkillBlocks === "lastWins"
      ? listLastResultPerSkill(results)
      : results
  ).filter((result): result is BuiltBlockResult => result.status !== "empty");
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

import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { BlockResult } from "./blockWalk";

export type FilledBlockResult = Extract<BlockResult, { status: "filled" }>;
/** A block result the set list builds: branch selected or prescribed. */
export type BuiltBlockResult = Exclude<BlockResult, { status: "empty" }>;

export interface WorkoutFinishRules {
  // "every" throws for the first empty block in template order, with its
  // reason, so a workout whose blocks belong together never returns a part of
  // it; "none" builds the blocks that are not empty.
  readonly requiredBlocks: "every" | "none";
}

// Takes the built blocks in template order.
export type SetListBuilder<TEntry> = (blocks: BuiltBlockResult[]) => TEntry[];

export interface FinishedWorkout<TEntry> {
  blocks: BuiltBlockResult[];
  setList: TEntry[];
}

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
 * Builds the set list from the blocks that are not empty, in template order.
 * An empty set list throws the reason of the first empty block in template
 * order. The empty check reads the built set list, as the old generator does,
 * because the builder drops branches without a catalog exercise.
 */
export const finishWorkout = <TEntry>(
  results: readonly BlockResult[],
  rules: WorkoutFinishRules,
  buildSetList: SetListBuilder<TEntry>,
): FinishedWorkout<TEntry> => {
  if (rules.requiredBlocks === "every") requireEveryBlock(results);
  const blocks = results.filter(
    (result): result is BuiltBlockResult => result.status !== "empty",
  );
  const setList = buildSetList(blocks);
  if (setList.length === 0) {
    for (const result of results) {
      if (result.status === "empty" && result.reason) throw result.reason;
    }
  }
  return { blocks, setList };
};

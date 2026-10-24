import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { BlockValues, CatalogRest } from "@/schemas/aiwl.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { GenerationInput } from "./generationInput";

/** The resolved values of one block that a set list builder reads. */
export interface SetListBlock {
  readonly skill: SkillCode;
  // The minute budget of a cardio block; 0 outside cardio, as the old
  // builder's length.
  readonly minutes: number;
  readonly sets: number;
  // The caller passes only the block's own afterBlock, never the catalog's,
  // because the builder applies the catalog fallback itself.
  readonly rest: CatalogRest;
  readonly setDuration?: number;
  readonly values?: BlockValues;
}

/**
 * The contract of the cardio, max strength and standard builders: turns the
 * exercise pairs of one block into its sets and rests.
 */
export type SkillSetListBuilder = (
  pairs: readonly ExercisePair[],
  block: SetListBlock,
  input: GenerationInput,
) => GeneratedSetListEntry[];

/** Drops the rest that closes the whole set list, so a workout ends on a set. */
export const removeTrailingPause = (
  setList: readonly GeneratedSetListEntry[],
): GeneratedSetListEntry[] => {
  const last = setList.at(-1);
  return last && isPauseExercise(last.exerciseId)
    ? setList.slice(0, -1)
    : [...setList];
};

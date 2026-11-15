import type { SetTuple } from "@/common/types/SetTuple";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import {
  isPauseExercise,
  PAUSE_EXERCISE_ID,
  PLACEHOLDER_BRANCH_ID,
} from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type {
  BlockValues,
  CatalogRest,
  ExercisesBlock,
} from "@/schemas/aiwl.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { GenerationInput } from "../generationInput/generationInput";
import type { PrescribedExerciseReference } from "../stages/blockWalk";

/** The resolved values of one block that a set list builder reads. */
export interface SetListBlock {
  readonly skill: SkillCode;
  // The minute budget of a cardio block; 0 outside cardio, as the old
  // builder's length.
  readonly minutes: number;
  readonly sets: number;
  // afterBlock is the block's own value, else the skill catalog's; without
  // either, the block closes on afterExercise.
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

/** The keys every exercises block sets, whatever its builder reads. */
export const PRESCRIBED_BLOCK_KEYS = ["kind", "skill", "exercises"] as const;

/** A setting of an exercises block beyond kind, skill and exercises. */
export type ExercisesBlockSetting = Exclude<
  keyof ExercisesBlock,
  (typeof PRESCRIBED_BLOCK_KEYS)[number]
>;

/**
 * The contract of the builders a source passes for exercises blocks: builds
 * the prescribed exercises of one block in list order. A source binds the
 * data its builder needs, so the set list stage passes none.
 */
export interface PrescribedSetListBuilder {
  // The block settings the builder reads; a block setting any other warns.
  readonly blockSettings: readonly ExercisesBlockSetting[];
  readonly build: (
    exercises: readonly PrescribedExerciseReference[],
    block: ExercisesBlock,
    input: GenerationInput,
  ) => GeneratedSetListEntry[];
}

/** The prescribed builders a source passes, by the skill of the block. */
export type PrescribedSetListBuilders = Readonly<
  Partial<Record<SkillCode, PrescribedSetListBuilder>>
>;

/**
 * Builds a rest between sets. The entry uses the placeholder branch, so
 * completing it changes no branch progression.
 */
export const buildPauseEntry = (
  set: SetTuple,
  skill: SkillCode,
  duration: number,
): GeneratedSetListEntry => ({
  branchId: PLACEHOLDER_BRANCH_ID,
  exerciseId: PAUSE_EXERCISE_ID,
  set,
  skill,
  duration,
});

/** Drops the rest that closes the whole set list, so a workout ends on a set. */
export const removeTrailingPause = (
  setList: readonly GeneratedSetListEntry[],
): GeneratedSetListEntry[] => {
  const last = setList.at(-1);
  return last && isPauseExercise(last.exerciseId)
    ? setList.slice(0, -1)
    : [...setList];
};

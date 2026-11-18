import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  type BranchSelectingBlock,
  type ExercisesBlock,
  readSkillSetListKind,
  type SkillSetListKind,
  type Superset,
} from "@/schemas/aiwl.schema";
import type { GenerationInput } from "../generationInput/generationInput";
import type { ResolvedBlockTiming } from "../setListBuilders/blockTiming";
import { drawCardioExercisePair } from "../setListBuilders/cardioSetListBuilder";
import { pairBranchExercises } from "../setListBuilders/exercisePairing";
import {
  type BlockTimingInput,
  createSetListBlock,
  readBlockTiming,
} from "../setListBuilders/setListBlockResolution";
import {
  PRESCRIBED_BLOCK_KEYS,
  type PrescribedSetListBuilder,
  type PrescribedSetListBuilders,
  removeTrailingPause,
} from "../setListBuilders/setListBuilder";
import { SKILL_SET_LIST_BUILDERS } from "../setListBuilders/skillSetListBuilders";
import { orderExerciseUnits, readEndingExerciseId } from "./exerciseOrder";
import {
  listIgnoredBlockSettings,
  warnIgnoredBlockSettings,
} from "./ignoredBlockSettings";
import type { FilledBlockResult, SetListBuilder } from "./workoutFinish";

/**
 * Names the superset a block pairs by. A max strength block trains each
 * exercise on its own, with the other side of a one-sided exercise ("none"),
 * whatever superset it sets. Every other block pairs by its own superset.
 *
 * readPairingSuperset("maxStrength", "muscles") → "none"
 */
const readPairingSuperset = (
  kind: Exclude<SkillSetListKind, "cardio">,
  superset: Superset,
): Superset => (kind === "maxStrength" ? "none" : superset);

interface PairingContext {
  readonly input: GenerationInput;
  // The exercise that ended the block before, which the block opens away from.
  readonly previousExerciseId: string | undefined;
}

/**
 * Pairs the exercises of a block and orders the pairs. A cardio block draws
 * one branch. Every other block opens away from the exercise that ended the
 * block before, max strength lower body first.
 */
const pairAndOrderBlockExercises = (
  kind: SkillSetListKind,
  { exercises }: FilledBlockResult,
  superset: Superset,
  { input, previousExerciseId }: PairingContext,
): ExercisePair[] => {
  if (kind === "cardio") {
    return drawCardioExercisePair(exercises, input.random);
  }
  const pairs = pairBranchExercises(
    exercises,
    input.exerciseCatalog,
    readPairingSuperset(kind, superset),
    input.random,
  );
  return orderExerciseUnits(
    pairs,
    { lowerBodyFirst: kind === "maxStrength", previousExerciseId },
    input.random,
  );
};

const buildBlockSetList = (
  kind: SkillSetListKind,
  pairs: ExercisePair[],
  {
    block,
    timing,
  }: { block: BranchSelectingBlock; timing: ResolvedBlockTiming },
  input: GenerationInput,
): GeneratedSetListEntry[] =>
  SKILL_SET_LIST_BUILDERS[kind](
    pairs,
    createSetListBlock(block, timing),
    input,
  );

/**
 * Names the builder of a branch selecting block: the one its skill code
 * selects. A skill the source passes a prescribed builder for throws.
 *
 * requireBranchSetListKind("MAX", {}) → "maxStrength"
 */
const requireBranchSetListKind = (
  skill: string,
  builders: PrescribedSetListBuilders,
): SkillSetListKind => {
  if (builders[skill]) {
    throw new Error(
      `${skill}: its prescribed builder builds exercises blocks only`,
    );
  }
  return readSkillSetListKind(skill);
};

const listUnreadBlockSettings = (
  block: ExercisesBlock,
  builder: PrescribedSetListBuilder,
): string[] =>
  Object.entries(block)
    .filter(
      ([key, value]) =>
        value !== undefined &&
        ![...PRESCRIBED_BLOCK_KEYS, ...builder.blockSettings].some(
          (accepted) => accepted === key,
        ),
    )
    .map(([key]) => key);

/**
 * Resolves the builder of an exercises block: the prescribed builder the
 * source passes for its skill. A skill without one throws; a block setting
 * the builder does not read logs a warning.
 *
 * resolvePrescribedSetListBuilder({ skill: "TEST", sets: 9, ... }, builders)
 * → the TEST builder, after the warning "TEST: the generator ignores sets"
 */
const resolvePrescribedSetListBuilder = (
  block: ExercisesBlock,
  builders: PrescribedSetListBuilders,
): PrescribedSetListBuilder => {
  const builder = builders[block.skill];
  if (!builder) {
    throw new Error(`${block.skill}: the source passed no prescribed builder`);
  }
  warnIgnoredBlockSettings(
    block.skill,
    listUnreadBlockSettings(block, builder),
  );
  return builder;
};

/**
 * Builds the set list of any workout source from its filled blocks in build
 * order, by one rule set. Each block reads its timing, pairs its exercises,
 * orders the pairs and runs the set list builder of its skill. The draws of
 * one block run in that order, before the next block. An exercises block runs
 * the prescribed builder of its skill from the builders the source passes.
 * A block setting its builder does not read logs one warning.
 * The set list drops the rest at its very end.
 */
export const createSetListBuilder =
  (
    input: BlockTimingInput,
    prescribedBuilders: PrescribedSetListBuilders = {},
  ): SetListBuilder<GeneratedSetListEntry> =>
  (blocks) => {
    let previousExerciseId: string | undefined;
    const setList = blocks.flatMap((result) => {
      if (result.status === "prescribed") {
        previousExerciseId =
          result.exercises.at(-1)?.exerciseId ?? previousExerciseId;
        return resolvePrescribedSetListBuilder(
          result.block,
          prescribedBuilders,
        ).build(result.exercises, result.block, input);
      }
      const kind = requireBranchSetListKind(
        result.block.skill,
        prescribedBuilders,
      );
      warnIgnoredBlockSettings(
        result.block.skill,
        listIgnoredBlockSettings(result.block, kind),
      );
      const timing = readBlockTiming(result.block, input);
      const pairs = pairAndOrderBlockExercises(kind, result, timing.superset, {
        input,
        previousExerciseId,
      });
      previousExerciseId = readEndingExerciseId(pairs, previousExerciseId);
      return buildBlockSetList(
        kind,
        pairs,
        { block: result.block, timing },
        input,
      );
    });
    return removeTrailingPause(setList);
  };

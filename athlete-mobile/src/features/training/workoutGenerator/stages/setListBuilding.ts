import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type {
  BranchSelectingBlock,
  ExercisesBlock,
  Superset,
} from "@/schemas/aiwl.schema";
import { readResolvedPicksBlockTiming } from "../blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";
import {
  type ResolvedBlockTiming,
  resolveBlockTiming,
} from "../setListBuilders/blockTiming";
import {
  buildCardioSetList,
  drawCardioExercisePair,
} from "../setListBuilders/cardioSetListBuilder";
import { pairBranchExercises } from "../setListBuilders/exercisePairing";
import { buildMaxStrengthSetList } from "../setListBuilders/maxStrengthSetListBuilder";
import { readTrainingDayTimingDefaults } from "../setListBuilders/trainingDayTiming";
import {
  PRESCRIBED_BLOCK_KEYS,
  type PrescribedSetListBuilder,
  type PrescribedSetListBuilders,
  removeTrailingPause,
  type SetListBlock,
  type SkillSetListBuilder,
} from "../setListBuilders/setListBuilder";
import { buildStandardSetList } from "../setListBuilders/standardSetListBuilder";
import { orderExerciseUnits, readEndingExerciseId } from "./exerciseOrder";
import type { FilledBlockResult, SetListBuilder } from "./workoutFinish";
import type { WorkoutInput } from "./workoutSetup";

export type SkillSetListKind = "cardio" | "maxStrength" | "standard";

const SECONDS_PER_MINUTE = 60;

const SKILL_SET_LIST_BUILDERS: Record<SkillSetListKind, SkillSetListBuilder> = {
  cardio: buildCardioSetList,
  maxStrength: buildMaxStrengthSetList,
  standard: buildStandardSetList,
};

/**
 * Names the set list builder of a skill: cardio first, then max strength,
 * else standard.
 *
 * readSkillSetListKind("CARDIO_5") → "cardio"
 * readSkillSetListKind("MAX_STRENGTH") → "maxStrength"
 */
export const readSkillSetListKind = (skill: string): SkillSetListKind => {
  if (skill.includes("CARDIO")) return "cardio";
  if (skill.includes("MAX")) return "maxStrength";
  return "standard";
};

type SetListBuildingInput = GenerationInput &
  Pick<WorkoutInput, "picksWorkout">;

// Workout setup resolves picks blocks only, so every other block resolves
// against the training day defaults.
const readBlockTiming = (
  block: BranchSelectingBlock,
  input: SetListBuildingInput,
): ResolvedBlockTiming =>
  block.kind === "picks"
    ? readResolvedPicksBlockTiming(input.picksWorkout, block)
    : resolveBlockTiming(
        block,
        readTrainingDayTimingDefaults(block.skill, input.skillCatalog),
      );

/**
 * Names the superset a block pairs by. A max strength block trains each
 * exercise on its own, with the other side of a one-sided exercise ("none"),
 * unless the block sets "singles"; every other block pairs by its own
 * superset.
 *
 * readPairingSuperset("maxStrength", "muscles") → "none"
 */
const readPairingSuperset = (
  kind: Exclude<SkillSetListKind, "cardio">,
  superset: Superset,
): Superset =>
  kind === "maxStrength" && superset !== "singles" ? "none" : superset;

interface PairingContext {
  readonly input: GenerationInput;
  // The exercise that ended the block before, which the block opens away from.
  readonly previousExerciseId: string | undefined;
}

/**
 * Pairs the exercises of a block and orders the pairs. A cardio block draws
 * one branch. A singles block keeps the draw order; every other block opens
 * away from the exercise that ended the block before, max strength lower body
 * first.
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
  const pairingSuperset = readPairingSuperset(kind, superset);
  const pairs = pairBranchExercises(
    exercises,
    input.exerciseCatalog,
    pairingSuperset,
    input.random,
  );
  if (pairingSuperset === "singles") return pairs;
  return orderExerciseUnits(
    pairs,
    { lowerBodyFirst: kind === "maxStrength", previousExerciseId },
    input.random,
  );
};

/**
 * Reads the minute budget of a block: the stored duration of a training day
 * branches block, else 0.
 *
 * readBlockMinutes({ kind: "branches", duration: 1200, ... }) → 20
 */
const readBlockMinutes = (block: BranchSelectingBlock): number =>
  block.kind === "branches" ? (block.duration ?? 0) / SECONDS_PER_MINUTE : 0;

const buildBlockSetList = (
  kind: SkillSetListKind,
  pairs: ExercisePair[],
  {
    block,
    timing,
  }: { block: BranchSelectingBlock; timing: ResolvedBlockTiming },
  input: GenerationInput,
): GeneratedSetListEntry[] => {
  const { superset, ...setListTiming } = timing;
  const setListBlock: SetListBlock = {
    skill: block.skill,
    minutes: readBlockMinutes(block),
    ...setListTiming,
  };
  return SKILL_SET_LIST_BUILDERS[kind](pairs, setListBlock, input);
};

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
 * source passes for its skill. A skill without one, and a block setting the
 * builder does not read, throw.
 *
 * resolvePrescribedSetListBuilder({ skill: "TEST", sets: 9, ... }, builders)
 * → throws "TEST: its prescribed builder does not read sets"
 */
const resolvePrescribedSetListBuilder = (
  block: ExercisesBlock,
  builders: PrescribedSetListBuilders,
): PrescribedSetListBuilder => {
  const builder = builders[block.skill];
  if (!builder) {
    throw new Error(`${block.skill}: the source passed no prescribed builder`);
  }
  const unread = listUnreadBlockSettings(block, builder);
  if (unread.length > 0) {
    throw new Error(
      `${block.skill}: its prescribed builder does not read ${unread.join(", ")}`,
    );
  }
  return builder;
};

/**
 * Builds the set list of any workout source from its filled blocks in build
 * order, by one rule set. Each block reads its timing, pairs its exercises,
 * orders the pairs and runs the set list builder of its skill. The draws of
 * one block run in that order, before the next block. An exercises block runs
 * the prescribed builder of its skill from the builders the source passes.
 * The set list drops the rest at its very end.
 */
export const createSetListBuilder =
  (
    input: SetListBuildingInput,
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

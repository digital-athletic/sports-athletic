import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Block } from "@/schemas/aiwl.schema";
import type { ExercisesBlock } from "@/schemas/strengthTestTemplate.schema";
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
import type { BlockResult, BranchSelectingBlock } from "./blockWalk";
import { orderExerciseUnits, readEndingExerciseId } from "./exerciseOrder";
import type {
  BuiltBlockResult,
  FilledBlockResult,
  SetListBuilder,
} from "./workoutFinish";
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

/**
 * The intended differences between workout sources once their exercises are
 * selected. Every source builds its set list through createSetListBuilder.
 */
export interface SetListBuildingRules {
  // "workoutSetup" reads the timing that workout setup resolved from the skill
  // catalog for a picks block; "trainingDayDefaults", and any other block,
  // resolve the block against readTrainingDayTimingDefaults.
  readonly blockTiming: "workoutSetup" | "trainingDayDefaults";
  // "drawOne" runs one drawn cardio branch; "bySuperset" pairs cardio like
  // every other block.
  readonly cardioPairing: "drawOne" | "bySuperset";
  // "singles" trains every max strength exercise on its own; "bySuperset"
  // pairs it and trains the lead only.
  readonly maxStrengthPairing: "singles" | "bySuperset";
  // "bySuperset" pairs every block but a drawOne cardio block by the rules
  // above; "singlesAsDrawn" overrides maxStrengthPairing and the superset and
  // trains every drawn exercise alone, in draw order, without its other side,
  // as the old strength test warm-up does.
  readonly branchPairing: "bySuperset" | "singlesAsDrawn";
  // "awayFromPreviousBlock" orders the pairs of every block but cardio so the
  // block opens away from the exercise that ended the block before, max
  // strength lower body first; "asPaired" keeps the order of the pairs.
  readonly exerciseOrder: "awayFromPreviousBlock" | "asPaired";
  // "setListEnd" drops the rest closing the whole set list;
  // "lastTemplateBlock" drops it only when the last template block is filled.
  readonly closingRest: "setListEnd" | "lastTemplateBlock";
}

export const TRAINING_DAY_SET_LIST_RULES: SetListBuildingRules = {
  blockTiming: "trainingDayDefaults",
  cardioPairing: "drawOne",
  maxStrengthPairing: "singles",
  branchPairing: "bySuperset",
  exerciseOrder: "awayFromPreviousBlock",
  closingRest: "setListEnd",
};

export const SHORT_WORKOUT_SET_LIST_RULES: SetListBuildingRules = {
  blockTiming: "workoutSetup",
  cardioPairing: "bySuperset",
  maxStrengthPairing: "bySuperset",
  branchPairing: "bySuperset",
  exerciseOrder: "asPaired",
  closingRest: "lastTemplateBlock",
};

// The old strength test ends on the last test set, and its warm-up block
// carries its own timing.
export const STRENGTH_TEST_SET_LIST_RULES: SetListBuildingRules = {
  blockTiming: "trainingDayDefaults",
  cardioPairing: "bySuperset",
  maxStrengthPairing: "bySuperset",
  branchPairing: "singlesAsDrawn",
  exerciseOrder: "asPaired",
  closingRest: "setListEnd",
};

type SetListBuildingInput = GenerationInput &
  Pick<WorkoutInput, "picksWorkout">;

// Workout setup resolves picks blocks only, so a branches block of a short
// workout resolves against the training day defaults too.
const readBlockTiming = (
  block: BranchSelectingBlock,
  rules: SetListBuildingRules,
  input: SetListBuildingInput,
): ResolvedBlockTiming =>
  rules.blockTiming === "workoutSetup" && block.kind === "picks"
    ? readResolvedPicksBlockTiming(input.picksWorkout, block)
    : resolveBlockTiming(
        block,
        readTrainingDayTimingDefaults(block.skill, input.skillCatalog),
      );

const pairBlockExercises = (
  kind: SkillSetListKind,
  { exercises }: FilledBlockResult,
  superset: ResolvedBlockTiming["superset"],
  { rules, input }: { rules: SetListBuildingRules; input: GenerationInput },
): ExercisePair[] => {
  if (kind === "cardio" && rules.cardioPairing === "drawOne") {
    return drawCardioExercisePair(exercises, input.random);
  }
  if (rules.branchPairing === "singlesAsDrawn") {
    return exercises.map((first) => ({ first }));
  }
  const singles =
    kind === "maxStrength" && rules.maxStrengthPairing === "singles";
  return pairBranchExercises(
    exercises,
    input.exerciseCatalog,
    singles ? "none" : superset,
    input.random,
  );
};

/**
 * Reads the minute budget of a block: the stored duration of a training day
 * branches block, else 0.
 *
 * readBlockMinutes({ kind: "branches", duration: 1200, ... }) → 20
 */
const readBlockMinutes = (block: Block): number =>
  block.kind === "branches" ? (block.duration ?? 0) / SECONDS_PER_MINUTE : 0;

const buildBlockSetList = (
  kind: SkillSetListKind,
  pairs: ExercisePair[],
  { block, timing }: { block: Block; timing: ResolvedBlockTiming },
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

const isLastTemplateBlock = (
  block: BuiltBlockResult,
  results: readonly BlockResult[],
): boolean => block === results.at(-1);

const closeBlockSetList = (
  blockSetList: GeneratedSetListEntry[],
  result: BuiltBlockResult,
  results: readonly BlockResult[],
  rules: SetListBuildingRules,
): GeneratedSetListEntry[] =>
  rules.closingRest === "lastTemplateBlock" &&
  isLastTemplateBlock(result, results)
    ? removeTrailingPause(blockSetList)
    : blockSetList;

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
 * order. Each block reads its timing, pairs its exercises, orders the pairs
 * and runs the set list builder of its skill, as the rules of the source say.
 * The draws of one block run in that order, before the next block. An
 * exercises block runs the prescribed builder of its skill from the builders
 * the source passes.
 */
export const createSetListBuilder =
  (
    input: SetListBuildingInput,
    rules: SetListBuildingRules,
    prescribedBuilders: PrescribedSetListBuilders = {},
  ): SetListBuilder<GeneratedSetListEntry> =>
  (blocks, results) => {
    let previousExerciseId: string | undefined;
    const setList = blocks.flatMap((result) => {
      if (result.status === "prescribed") {
        const prescribedSetList = resolvePrescribedSetListBuilder(
          result.block,
          prescribedBuilders,
        ).build(result.exercises, result.block, input);
        previousExerciseId =
          result.exercises.at(-1)?.exerciseId ?? previousExerciseId;
        return closeBlockSetList(prescribedSetList, result, results, rules);
      }
      const kind = requireBranchSetListKind(
        result.block.skill,
        prescribedBuilders,
      );
      const timing = readBlockTiming(result.block, rules, input);
      const pairs = pairBlockExercises(kind, result, timing.superset, {
        rules,
        input,
      });
      const orderedPairs =
        rules.exerciseOrder === "asPaired" || kind === "cardio"
          ? pairs
          : orderExerciseUnits(
              pairs,
              { lowerBodyFirst: kind === "maxStrength", previousExerciseId },
              input.random,
            );
      previousExerciseId = readEndingExerciseId(
        orderedPairs,
        previousExerciseId,
      );
      const blockSetList = buildBlockSetList(
        kind,
        orderedPairs,
        { block: result.block, timing },
        input,
      );
      return closeBlockSetList(blockSetList, result, results, rules);
    });
    return rules.closingRest === "setListEnd"
      ? removeTrailingPause(setList)
      : setList;
  };

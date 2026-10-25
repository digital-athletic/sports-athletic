import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Block } from "@/schemas/aiwl.schema";
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
  removeTrailingPause,
  type SetListBlock,
  type SkillSetListBuilder,
} from "../setListBuilders/setListBuilder";
import { buildStandardSetList } from "../setListBuilders/standardSetListBuilder";
import type { BlockResult } from "./blockWalk";
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

/**
 * The intended differences between workout sources once their exercises are
 * selected. Every source builds its set list through createSetListBuilder.
 */
export interface SetListBuildingRules {
  // "workoutSetup" reads the timing that workout setup resolved from the skill
  // catalog; "trainingDayDefaults" resolves the block against
  // readTrainingDayTimingDefaults.
  readonly blockTiming: "workoutSetup" | "trainingDayDefaults";
  // "drawOne" runs one drawn cardio branch; "bySuperset" pairs cardio like
  // every other block.
  readonly cardioPairing: "drawOne" | "bySuperset";
  // "singles" trains every max strength exercise on its own; "bySuperset"
  // pairs it and trains the lead only.
  readonly maxStrengthPairing: "singles" | "bySuperset";
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
  exerciseOrder: "awayFromPreviousBlock",
  closingRest: "setListEnd",
};

export const SHORT_WORKOUT_SET_LIST_RULES: SetListBuildingRules = {
  blockTiming: "workoutSetup",
  cardioPairing: "bySuperset",
  maxStrengthPairing: "bySuperset",
  exerciseOrder: "asPaired",
  closingRest: "lastTemplateBlock",
};

type SetListBuildingInput = GenerationInput &
  Pick<WorkoutInput, "picksWorkout">;

const readBlockTiming = (
  block: Block,
  rules: SetListBuildingRules,
  input: SetListBuildingInput,
): ResolvedBlockTiming =>
  rules.blockTiming === "workoutSetup"
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
  block: FilledBlockResult,
  results: readonly BlockResult[],
): boolean => block === results.at(-1);

/**
 * Builds the set list of any workout source from its filled blocks in build
 * order. Each block reads its timing, pairs its exercises, orders the pairs
 * and runs the set list builder of its skill, as the rules of the source say.
 * The draws of one block run in that order, before the next block.
 */
export const createSetListBuilder =
  (
    input: SetListBuildingInput,
    rules: SetListBuildingRules,
  ): SetListBuilder<GeneratedSetListEntry> =>
  (blocks, results) => {
    let previousExerciseId: string | undefined;
    const setList = blocks.flatMap((result) => {
      const kind = readSkillSetListKind(result.block.skill);
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
      return rules.closingRest === "lastTemplateBlock" &&
        isLastTemplateBlock(result, results)
        ? removeTrailingPause(blockSetList)
        : blockSetList;
    });
    return rules.closingRest === "setListEnd"
      ? removeTrailingPause(setList)
      : setList;
  };

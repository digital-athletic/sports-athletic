import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Block } from "@/schemas/aiwl.schema";
import { type ResolvedBlockTiming, resolveBlockTiming } from "./blockTiming";
import type { BlockResult } from "./blockWalk";
import {
  buildCardioSetList,
  drawCardioExercisePair,
} from "./cardioSetListBuilder";
import { orderExerciseUnits, readEndingExerciseId } from "./exerciseOrder";
import { pairBranchExercises } from "./exercisePairing";
import type { GenerationInput } from "./generationInput";
import { buildMaxStrengthSetList } from "./maxStrengthSetListBuilder";
import { readPlanWorkoutTiming } from "./planWorkoutTiming";
import {
  removeTrailingPause,
  type SetListBlock,
  type SkillSetListBuilder,
} from "./setListBuilder";
import { readSkillCatalogEntry } from "./skillCatalogEntry";
import { buildStandardSetList } from "./standardSetListBuilder";
import type { FilledBlockResult, SetListBuilder } from "./workoutFinish";

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

// A training day cardio block runs one drawn branch; max strength trains
// single exercises.
const pairTrainingDayExercises = (
  kind: SkillSetListKind,
  { exercises }: FilledBlockResult,
  superset: ResolvedBlockTiming["superset"],
  input: GenerationInput,
): ExercisePair[] => {
  switch (kind) {
    case "cardio":
      return drawCardioExercisePair(exercises, input.random);
    case "maxStrength":
      return pairBranchExercises(
        exercises,
        input.exerciseCatalog,
        "none",
        input.random,
      );
    case "standard":
      return pairBranchExercises(
        exercises,
        input.exerciseCatalog,
        superset,
        input.random,
      );
  }
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

/**
 * Builds the set list of a training day from its filled blocks in section
 * order. Each block reads its own timing, then the plan workout timing of its
 * skill. Except for cardio, the pairs are ordered so that a block opens away
 * from the exercise that ended the block before, max strength lower body
 * first. The rest closing the whole set list is dropped.
 */
export const createTrainingDaySetListBuilder =
  (input: GenerationInput): SetListBuilder<GeneratedSetListEntry> =>
  (blocks) => {
    let previousExerciseId: string | undefined;
    const setList = blocks.flatMap((result) => {
      const kind = readSkillSetListKind(result.block.skill);
      const timing = resolveBlockTiming(
        result.block,
        readPlanWorkoutTiming(result.block.skill),
      );
      const pairs = pairTrainingDayExercises(
        kind,
        result,
        timing.superset,
        input,
      );
      const orderedPairs =
        kind === "cardio"
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
      return buildBlockSetList(
        kind,
        orderedPairs,
        { block: result.block, timing },
        input,
      );
    });
    return removeTrailingPause(setList);
  };

const isLastTemplateBlock = (
  block: FilledBlockResult,
  results: readonly BlockResult[],
): boolean => block === results.at(-1);

/**
 * Builds the set list of a short workout from its filled blocks in template
 * order. Each block reads its own timing, then the skill catalog entry. Every
 * block, cardio and max strength included, pairs by its superset and keeps
 * the order of its pairs. Only a filled last template block drops its closing
 * rest; an empty last block keeps the rest before it.
 */
export const createShortWorkoutSetListBuilder =
  (input: GenerationInput): SetListBuilder<GeneratedSetListEntry> =>
  (blocks, results) =>
    blocks.flatMap((result) => {
      const kind = readSkillSetListKind(result.block.skill);
      const timing = resolveBlockTiming(
        result.block,
        readSkillCatalogEntry(input.skillCatalog, result.block.skill),
      );
      const setList = buildBlockSetList(
        kind,
        pairBranchExercises(
          result.exercises,
          input.exerciseCatalog,
          timing.superset,
          input.random,
        ),
        { block: result.block, timing },
        input,
      );
      return isLastTemplateBlock(result, results)
        ? removeTrailingPause(setList)
        : setList;
    });

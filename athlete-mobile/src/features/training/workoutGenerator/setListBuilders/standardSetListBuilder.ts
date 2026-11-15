import type { SetTuple } from "@/common/types/SetTuple";
import { TagGroups } from "@/constants/tagGroups";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import {
  createExerciseMap,
  type ExerciseMap,
} from "@/features/training/utils/exerciseAccessor";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { ExerciseStartValues } from "@/schemas/generator.schema";
import { getTagValues } from "@/utils/tagUtils";
import {
  type ExerciseStartValueSource,
  readExerciseStartValues,
} from "../exerciseValues/exerciseStartValues";
import {
  buildPauseEntry,
  type SetListBlock,
  type SkillSetListBuilder,
} from "./setListBuilder";
import { sharesAnyValue } from "./sharedValues";

// The exercise ID of a branch that resolved to no exercise.
const UNRESOLVED_EXERCISE_ID = "-1";
const HYPERTROPHY_WARM_UP_REST = 60;

interface StandardSetListContext {
  block: SetListBlock;
  source: ExerciseStartValueSource;
  exerciseMap: ExerciseMap;
}

interface StartValuePair {
  first: ExerciseStartValues;
  second?: ExerciseStartValues;
}

/** True when the set list builder builds the pair: no pause and a catalog lead. */
export const isBuildablePair = (
  pair: ExercisePair,
  exerciseMap: Map<string, ExerciseType>,
): boolean =>
  pair.first.exerciseId !== UNRESOLVED_EXERCISE_ID &&
  exerciseMap.has(pair.first.exerciseId) &&
  pair.second?.exerciseId !== UNRESOLVED_EXERCISE_ID;

/**
 * Lists the tag values of both exercises of a pair in one tag group.
 *
 * listPairTagValues({ first: { branchTags: ["MUSCLE_CHEST"] } }, "MUSCLE") → ["CHEST"]
 */
const listPairTagValues = (pair: ExercisePair, tagGroup: string): string[] =>
  [pair.first, pair.second].flatMap((entry) =>
    entry ? getTagValues(entry.branchTags, tagGroup) : [],
  );

/**
 * True when the next pair trains the same body region and the same primary
 * muscles, so the finished pair closes on the rest between sets.
 */
const trainsSameRegionAndPrimaryMuscle = (
  finished: ExercisePair,
  next: ExercisePair,
): boolean =>
  sharesAnyValue(
    listPairTagValues(finished, TagGroups.REGION),
    listPairTagValues(next, TagGroups.REGION),
  ) &&
  sharesAnyValue(
    listPairTagValues(finished, TagGroups.MUSCLE),
    listPairTagValues(next, TagGroups.MUSCLE),
  );

// The pair compares with the next pair the builder builds, never with an
// unresolved one, and the last built pair closes the block.
const readClosingRest = (
  pairs: readonly ExercisePair[],
  index: number,
  { block, exerciseMap }: StandardSetListContext,
): number => {
  const nextPair = pairs
    .slice(index + 1)
    .find((pair) => isBuildablePair(pair, exerciseMap));
  if (!nextPair) {
    return block.rest.afterBlock ?? block.rest.afterExercise;
  }
  return trainsSameRegionAndPrimaryMuscle(pairs[index], nextPair)
    ? block.rest.betweenSets
    : block.rest.afterExercise;
};

// A partner missing from the catalog makes the old generator throw; the
// builder trains the lead alone instead.
const readPairStartValues = (
  pair: ExercisePair,
  { block, source, exerciseMap }: StandardSetListContext,
): StartValuePair | undefined => {
  const firstExercise = exerciseMap.get(pair.first.exerciseId);
  if (!firstExercise || pair.first.exerciseId === UNRESOLVED_EXERCISE_ID) {
    return undefined;
  }
  const first = readExerciseStartValues(
    source,
    block,
    pair.first,
    firstExercise,
  );
  const partner = pair.second;
  if (!partner?.exerciseId) return { first };
  if (partner.exerciseId === UNRESOLVED_EXERCISE_ID) return undefined;
  const secondExercise = exerciseMap.get(partner.exerciseId);
  if (!secondExercise) return { first };
  return {
    first,
    second: readExerciseStartValues(source, block, partner, secondExercise),
  };
};

const isWeightedEntry = (entry: ExerciseStartValues | undefined): boolean =>
  !!entry && getTagValues(entry.tags, TagGroups.EQ_TYPE).includes("WEIGHTS");

// Power endurance and explosive power open a weighted pair with a warm-up set.
const hasWarmUpSet = (skill: string, values: StartValuePair): boolean =>
  (skill.includes("SWR") || skill.includes("SK")) &&
  (isWeightedEntry(values.first) || isWeightedEntry(values.second));

const buildWarmUpSet = (
  values: StartValuePair,
  { skill, rest }: SetListBlock,
  set: SetTuple,
): GeneratedSetListEntry[] => {
  const isExplosivePower = skill.includes("SK");
  const weightFactor = isExplosivePower ? 0.65 : 0.7;
  const pause = values.second
    ? rest.withinSuperset
    : isExplosivePower
      ? rest.betweenSets
      : HYPERTROPHY_WARM_UP_REST;
  return [values.first, values.second].flatMap((entry) =>
    entry
      ? [
          {
            branchId: entry.branchId,
            exerciseId: entry.exerciseId,
            tags: [...entry.tags],
            set,
            skill,
            duration: entry.duration,
            repetition: isExplosivePower ? 6 : entry.repetition,
            weight:
              entry.weight === undefined
                ? undefined
                : entry.weight * weightFactor,
            height: entry.height,
            weightType: entry.weightType,
          },
          buildPauseEntry(set, skill, pause),
        ]
      : [],
  );
};

// A superset rests within the superset after each exercise, a single exercise
// between sets; the last set closes on the closing rest.
const buildWorkSet = (
  values: StartValuePair,
  { skill, rest }: SetListBlock,
  set: SetTuple,
  closingRest: number,
): GeneratedSetListEntry[] => {
  const roundRest = values.second ? rest.withinSuperset : rest.betweenSets;
  const pause = set[0] === set[1] ? closingRest : roundRest;
  const lead = { ...values.first, set, skill };
  if (!values.second) return [lead, buildPauseEntry(set, skill, pause)];
  return [
    lead,
    buildPauseEntry(set, skill, rest.withinSuperset),
    { ...values.second, set, skill },
    buildPauseEntry(set, skill, pause),
  ];
};

const buildPairSetList = (
  values: StartValuePair,
  block: SetListBlock,
  closingRest: number,
): GeneratedSetListEntry[] => {
  const warmUpSets = hasWarmUpSet(block.skill, values) ? 1 : 0;
  const setCount = block.sets + warmUpSets;
  const warmUp =
    warmUpSets > 0 ? buildWarmUpSet(values, block, [1, setCount]) : [];
  const workSets = Array.from({ length: block.sets }, (_, index) =>
    buildWorkSet(
      values,
      block,
      [index + 1 + warmUpSets, setCount],
      closingRest,
    ),
  );
  return [...warmUp, ...workSets.flat()];
};

/**
 * Builds the sets of a standard block: per pair an optional warm-up set, then
 * the block's sets with their rests. Pairs with an unresolved exercise or a
 * lead missing from the catalog build nothing. The last pair closes on the
 * resolved `rest.afterBlock`, else on `rest.afterExercise`.
 */
export const buildStandardSetList: SkillSetListBuilder = (
  pairs,
  block,
  input,
) => {
  const context: StandardSetListContext = {
    block,
    source: {
      skillCatalog: input.skillCatalog,
      athlete: input.athlete,
      storedProgress: input.exerciseData,
    },
    exerciseMap: createExerciseMap(input.exerciseCatalog),
  };
  return pairs.flatMap((pair, index) => {
    const values = readPairStartValues(pair, context);
    return values
      ? buildPairSetList(values, block, readClosingRest(pairs, index, context))
      : [];
  });
};

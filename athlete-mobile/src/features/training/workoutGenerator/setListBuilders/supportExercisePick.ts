import type { SetTuple } from "@/common/types/SetTuple";
import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { PLACEHOLDER_BRANCH_ID } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import {
  areaToRegion,
  getAreasFor,
} from "@/features/training/utils/exerciseUtils";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { UserType } from "@/schemas/user.schema";
import { getTagValues } from "@/utils/tagUtils";
import { isEquipmentPartAvailable } from "../ruleFamilies/equipmentAvailability";
import { readGenderTag } from "../exerciseValues/exerciseStartValues";
import type { GenerationInput } from "../generationInput/generationInput";
import { readGenderLevelValue } from "../exerciseValues/startAndTargetValues";

export const SUPPORT_SET_SECONDS = 30;
export const SUPPORT_SET_REPETITIONS = 8;

type SupportExerciseType = "weighted" | "bodyweight";

/** What the support exercise picks of one block used so far. */
export interface SupportExerciseTally {
  readonly usedExerciseIds: readonly string[];
  readonly weightedCount: number;
  readonly bodyweightCount: number;
}

export const EMPTY_SUPPORT_EXERCISE_TALLY: SupportExerciseTally = {
  usedExerciseIds: [],
  weightedCount: 0,
  bodyweightCount: 0,
};

export interface SupportExercisePick {
  exercise: ExerciseType;
  tally: SupportExerciseTally;
}

const sharesAnyValue = (a: string[], b: string[]): boolean =>
  a.some((value) => b.includes(value));

const hasEquipmentForExercise = (
  exercise: ExerciseType,
  equipment: readonly string[],
): boolean => {
  const parts = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
  return parts.every((part) =>
    isEquipmentPartAvailable({
      part,
      equipment,
      branchParts: parts,
      exerciseIds: exercise.id ? [exercise.id] : [],
    }),
  );
};

// A one sided support exercise enters the pool by its left or only side.
const isSupportExercise = (exercise: ExerciseType): boolean =>
  getTagValues(exercise.tags, TagGroups.SKILL).includes("SUPPORT") &&
  !getTagValues(exercise.tags, TagGroups.SIDE).includes("RIGHT") &&
  !!exercise.displayName;

/**
 * Lists the support exercises that may rest between the working sets of the
 * main lift: no sore region, no primary muscle of the main lift, and the
 * equipment at the place.
 *
 * listSupportExercises(squat, input) → [plank, ...]
 */
export const listSupportExercises = (
  mainLift: ExerciseType,
  input: GenerationInput,
): ExerciseType[] => {
  const soreRegions = getAreasFor(
    input.muscleSoreness.map((entry) => entry.tag),
  ).map(areaToRegion);
  const mainLiftMuscles = getTagValues(mainLift.tags, TagGroups.MUSCLE);
  return input.exerciseCatalog.filter(
    (exercise) =>
      isSupportExercise(exercise) &&
      !sharesAnyValue(
        getTagValues(exercise.tags, TagGroups.REGION),
        soreRegions,
      ) &&
      !sharesAnyValue(
        getTagValues(exercise.tags, TagGroups.MUSCLE),
        mainLiftMuscles,
      ) &&
      hasEquipmentForExercise(exercise, input.equipment),
  );
};

/**
 * Reads the share of weighted support exercises a block aims for: 30 % for a
 * child, 60 % in a studio, 50 % elsewhere.
 */
export const readWeightedSupportShare = ({
  athlete,
  place,
}: GenerationInput): number => {
  if (
    ageGroupFor(getUserBirthday(athlete)) === WorkoutConstants.AGE_GROUPS.CHILD
  ) {
    return 0.3;
  }
  return place === "STUDIO" ? 0.6 : 0.5;
};

const filterBySupportExerciseType = (
  exercises: ExerciseType[],
  type: SupportExerciseType,
): ExerciseType[] =>
  exercises.filter(
    (exercise) =>
      hasWeights(getTagValues(exercise.tags, TagGroups.EQUIPMENT)) ===
      (type === "weighted"),
  );

const readPreferredType = (
  { weightedCount, bodyweightCount }: SupportExerciseTally,
  weightedShare: number,
): SupportExerciseType => {
  const count = weightedCount + bodyweightCount;
  return count > 0 && weightedCount / count > weightedShare
    ? "bodyweight"
    : "weighted";
};

// Every unused exercise is either weighted or bodyweight, so the other type
// has candidates whenever the preferred type has none.
const readCandidates = (
  unused: ExerciseType[],
  preferred: SupportExerciseType,
): { type: SupportExerciseType; candidates: ExerciseType[] } => {
  const preferredCandidates = filterBySupportExerciseType(unused, preferred);
  if (preferredCandidates.length > 0) {
    return { type: preferred, candidates: preferredCandidates };
  }
  const other = preferred === "weighted" ? "bodyweight" : "weighted";
  return {
    type: other,
    candidates: filterBySupportExerciseType(unused, other),
  };
};

/**
 * Picks the support exercise of one rest with one draw. The block keeps its
 * weighted share: once the weighted picks pass it, a bodyweight exercise
 * comes next. Each exercise appears at most once per block; without an unused
 * exercise nothing is picked and nothing drawn.
 *
 * pickSupportExercise([plank, curl], EMPTY_SUPPORT_EXERCISE_TALLY, 0.5, () => 0)
 * → { exercise: curl, tally: { usedExerciseIds: ["curl"], weightedCount: 1, bodyweightCount: 0 } }
 */
export const pickSupportExercise = (
  pool: readonly ExerciseType[],
  tally: SupportExerciseTally,
  weightedShare: number,
  random: () => number,
): SupportExercisePick | undefined => {
  const unused = pool.filter(
    (exercise) => !tally.usedExerciseIds.includes(exercise.id),
  );
  if (unused.length === 0) return undefined;
  const { type, candidates } = readCandidates(
    unused,
    readPreferredType(tally, weightedShare),
  );
  const exercise = candidates[Math.floor(random() * candidates.length)];
  return {
    exercise,
    tally: {
      usedExerciseIds: [...tally.usedExerciseIds, exercise.id],
      weightedCount: tally.weightedCount + (type === "weighted" ? 1 : 0),
      bodyweightCount: tally.bodyweightCount + (type === "bodyweight" ? 1 : 0),
    },
  };
};

const readSupportWeight = (
  exercise: ExerciseType,
  athlete: UserType,
): number | undefined => {
  const authored = exercise.values?.weight;
  if (
    !getTagValues(exercise.tags, TagGroups.EQ_TYPE).includes("WEIGHTS") ||
    !authored
  ) {
    return undefined;
  }
  const weight = readGenderLevelValue(
    authored.startValue,
    readGenderTag(athlete),
    getUserLevel(athlete).toLowerCase(),
  );
  return weight !== undefined && weight > -1 ? weight : undefined;
};

/**
 * Builds the two support sets of one rest: 8 repetitions or 30 s each, at the
 * authored start weight of a weighted exercise. A one sided exercise trains
 * its other side in the second set.
 */
export const buildSupportSets = (
  exercise: ExerciseType,
  athlete: UserType,
  set: SetTuple,
  skill: SkillCode,
): GeneratedSetListEntry[] => {
  const weight = readSupportWeight(exercise, athlete);
  const buildSupportSet = (exerciseId: string): GeneratedSetListEntry => ({
    branchId: PLACEHOLDER_BRANCH_ID,
    exerciseId,
    tags: [...exercise.tags],
    set,
    skill,
    ...(exercise.isAdvanceByReps
      ? { repetition: SUPPORT_SET_REPETITIONS }
      : { duration: SUPPORT_SET_SECONDS }),
    weight,
  });
  const otherSideId =
    exercise.tags.includes("SIDE_ONE") && exercise.otherSideExerciseId
      ? exercise.otherSideExerciseId
      : exercise.id;
  return [buildSupportSet(exercise.id), buildSupportSet(otherSideId)];
};

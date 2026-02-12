import { TagGroups } from "@/constants/tagGroups";
import { XP_PER_MINUTE } from "@/constants/userProgressConstants";
import { type LevelTag, WorkoutConstants } from "@/constants/workoutConstants";
import type { MaxValueType, UserType } from "@/schemas/user.schema";
import {
  type TrainingLevelType,
  type TrainingParameterType,
} from "@/schemas/common.schema";
import {
  type ExerciseType,
  type ExerciseValues,
  type ValueType,
} from "@/schemas/exercise.schema";
import {
  type SkillBranchType,
  type SkillTreeType,
} from "@/schemas/skillTree.schema";
import { Logger } from "@/services/Logger";
import { getTagValues, getUserTagValue } from "@/utils/tagUtils";
import { ExerciseBranchType } from "../models/ExerciseBranch";
import { isPauseExercise } from "../models/IdTypes";
import { GenderTag, IntensityData } from "../models/Intensity";
import {
  EXERCISE_DIRECTIONS_VALUES_MAP,
  MaxValuesType,
} from "../models/MaxValues";
import type { SkillCode } from "@/schemas/generator.schema";
import { TrainingTimeType } from "../models/Training";
import { UserExerciseDataType } from "../models/UserExerciseData";
import {
  filterByAge,
  filterByGender,
  filterByPrevention,
} from "./branchFilterUtils";
import { filterByEquipment } from "./equipmentUtils";

/**
 * Extracts the user's training level from their workout data tags.
 *
 * @param user - The user object containing workout data
 * @returns The user's training level or BEGINNER as a fallback
 */
export const getUserLevel = (user: UserType): LevelTag => {
  if (!user?.workoutData?.tags) {
    return WorkoutConstants.LEVELS.BEGINNER;
  }

  const level = getUserTagValue(user.workoutData.tags, TagGroups.LEVEL);
  return (level as LevelTag) ?? WorkoutConstants.LEVELS.BEGINNER;
};

export const getMaxValueForExercise = (
  exercise: ExerciseType,
  maxValues: MaxValuesType,
) => {
  const exerciseDirections = getTagValues(
    exercise.tags,
    TagGroups.EXERCISE_DIRECTION,
  );
  let exerciseDirection =
    exerciseDirections.length > 0 ? exerciseDirections[0] : null;
  const exerciseRegion = getTagValues(exercise.tags, TagGroups.REGION)[0];
  if (exerciseDirection === null) {
    exerciseDirection =
      exerciseRegion === "LOWER_BODY" ? "LOWER_BODY" : "VERTICAL_PULL";
  }
  if (exerciseDirection === "SIDE") {
    exerciseDirection = "LOWER_BODY";
  }
  const isOneSided = getTagValues(exercise.tags, TagGroups.SIDE).includes(
    "ONE",
  );
  const equipment = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
  const isDumbbellExercise = equipment.includes("DUMBBELL");
  let maxType: (typeof WorkoutConstants.MAX_VALUE_TYPES)[keyof typeof WorkoutConstants.MAX_VALUE_TYPES] =
    WorkoutConstants.MAX_VALUE_TYPES.BARBELL;
  if (isDumbbellExercise) {
    if (isOneSided) {
      maxType =
        exerciseRegion === "UPPER_BODY"
          ? WorkoutConstants.MAX_VALUE_TYPES.ONE_SIDED_UPPER
          : WorkoutConstants.MAX_VALUE_TYPES.ONE_SIDED_LOWER;
    } else {
      maxType = WorkoutConstants.MAX_VALUE_TYPES.DUMBBELLS;
    }
  } else if (isOneSided) {
    maxType = WorkoutConstants.MAX_VALUE_TYPES.ONE_SIDED_BARBELL;
  }
  const directionKey = EXERCISE_DIRECTIONS_VALUES_MAP[exerciseDirection];
  if (directionKey) {
    const directionValues = maxValues[directionKey];
    if (directionValues) {
      const maxValue = directionValues[maxType];
      if (typeof maxValue === "number" && isFinite(maxValue)) {
        return maxValue;
      }
    }
  }
  return undefined;
};

export const getRoundedResultForValueAndStep = (
  value: number,
  step: number,
) => {
  const remainder = value % step;
  return remainder < step / 2 ? value - remainder : value + step - remainder;
};

export const roundWeightValue = (value: number) => {
  if (!isFinite(value)) {
    Logger.logError(
      new Error(`f:roundWeightValue ~ input: ${value} is not a finite number`),
    );
    return 0;
  }
  if (value > 100) {
    return getRoundedResultForValueAndStep(value, 2.5);
  }
  if (value > 25) {
    return getRoundedResultForValueAndStep(value, 1);
  }
  return getRoundedResultForValueAndStep(value, 0.5);
};

export const calculateWorkoutTotals = (
  time: TrainingTimeType,
  exerciseList: UserExerciseDataType[],
  exercisesData: ExerciseType[],
  maxValues: MaxValuesType,
): {
  duration: number;
  count: number;
  xp: number;
  weight: number;
  height: number;
} => {
  let duration = 0;
  let pauseDuration = 0;
  let count = 0;
  let xp = 0;
  let weight = 0;
  let height = 0;
  if (exerciseList) {
    for (let exercise of exerciseList) {
      if (exercise.set && exercise.set[0] === exercise.set[1]) {
        // only count last exercise in set

        // do not count exercises from test workouts
        if (exercise.repetition === -1) continue;

        // add values for each completed set
        for (let i = 0; i < exercise.set[1]; i++) {
          //duration
          if (exercise.duration) {
            duration += +exercise.duration;
            if (isPauseExercise(exercise.exerciseId)) {
              // count pause duration - no xp
              pauseDuration += +exercise.duration;
            }
          } else if (exercise.repetition) {
            duration +=
              +exercise.repetition * WorkoutConstants.REP_DURATION_IN_S;
          }

          //weight
          if (exercise.weight && exercise.repetition) {
            let exerciseData = exercisesData.filter(
              (e) => e.id === exercise.exerciseId,
            )[0];
            let exerciseWeight = exercise.weight;
            if (exercise.weightType && exercise.weightType === "weightFMax") {
              // calculate weight value based on gven percentage in weight and max Value from test for given exercise
              let maxValue =
                getMaxValueForExercise(exerciseData, maxValues) ?? 0;
              exerciseWeight = roundWeightValue(
                (exerciseWeight / 100) * maxValue,
              );
            } else {
              // given weight is absolute, so just round it
              exerciseWeight = roundWeightValue(exerciseWeight);
            }
            weight += exerciseWeight * exercise.repetition;
          }
          //height
          if (exercise.height && exercise.repetition) {
            height += exercise.height * exercise.repetition;
          }
        }

        //count
        if (!isPauseExercise(exercise.exerciseId)) {
          // is not pause
          count++;
        }
      }
    }
  }

  if (
    time &&
    typeof time.start !== "undefined" &&
    time.start !== null &&
    typeof time.end !== "undefined" &&
    time.end !== null &&
    typeof time.pause !== "undefined" &&
    time.pause !== null
  ) {
    // calculate time in ms
    duration = time.end - time.start;
    // calculate xp from time without pause
    xp = Math.round(((duration - time.pause) / 1000 / 60) * XP_PER_MINUTE);
    // switch to seconds for return
    duration = Math.ceil(duration / 1000);
  } else {
    // use old estimation
    xp = (duration - pauseDuration) * XP_PER_MINUTE;
  }
  return {
    duration: duration,
    count: count,
    xp: xp,
    weight: weight,
    height: height,
  };
};

export const isInclineBenchPress = (
  equipment: string[],
  exerciseDirections: string[],
) => {
  if (equipment.indexOf(WorkoutConstants.EQUIPMENT.INCLINE_BENCH) > -1) {
    // possibly reduce weight for inclined press
    if (
      equipment
        .filter((eq) => eq.indexOf("BENCH") > -1)
        .filter(
          (bench) =>
            bench !== WorkoutConstants.EQUIPMENT.INCLINE_BENCH &&
            bench !== WorkoutConstants.EQUIPMENT.ADJUSTABLE_BENCH,
        ).length === 0
    ) {
      // no other banks
      if (
        exerciseDirections.indexOf(
          WorkoutConstants.EXERCISE_DIRECTIONS.HORIZONTAL_PUSH,
        ) > -1
      ) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Gets most specific value for given exercise, user and valueType
 *
 * @param skillIntensity
 * @param branchExercise
 * @param valueName
 * @param level
 * @param genderTag
 * @param maxValues
 */
export const getExerciseTargetValue = (
  skillIntensity: IntensityData,
  branchExercise: ExerciseType,
  valueName: TrainingParameterType,
  level: TrainingLevelType,
  genderTag: GenderTag,
) => {
  let value: number | undefined;
  if (
    skillIntensity.targetValue[valueName] &&
    skillIntensity.targetValue[valueName].default
  ) {
    // set default
    value = skillIntensity.targetValue[valueName].default?.default;

    if (skillIntensity.targetValue[valueName][genderTag]) {
      // more specific skill values
      value = skillIntensity.targetValue[valueName][genderTag].default;

      if (skillIntensity.targetValue[valueName][genderTag]?.[level]) {
        value = skillIntensity.targetValue[valueName][genderTag][level];
      }
    }
  }
  if (
    branchExercise.values &&
    branchExercise.values[valueName] &&
    branchExercise.values[valueName].targetValue
  ) {
    // more specific exercise values
    if (branchExercise.values[valueName].targetValue.default) {
      if (branchExercise.values[valueName].targetValue.default.default) {
        value = Number(
          branchExercise.values[valueName].targetValue.default.default,
        );
      }
      if (branchExercise.values[valueName].targetValue.default[level]) {
        value = Number(
          branchExercise.values[valueName].targetValue.default[level],
        );
      }
    }
    if (branchExercise.values[valueName].targetValue[genderTag]) {
      if (branchExercise.values[valueName].targetValue[genderTag].default) {
        value = Number(
          branchExercise.values[valueName].targetValue[genderTag].default,
        );
      }

      if (branchExercise.values[valueName].targetValue[genderTag][level]) {
        value = Number(
          branchExercise.values[valueName].targetValue[genderTag][level],
        );
      }
    }
  }

  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }

  console.log(`could not parse ${value} to number`);
  return undefined;
};

/**
 * Gets most specific value for given exercise, user and valueType
 *
 * @param skillIntensity
 * @param branchExercise
 * @param valueName
 * @param level
 * @param genderTag
 * @param maxValues
 */
export const getExerciseStartValue = (
  skillIntensity: IntensityData,
  branchExercise: ExerciseType,
  valueName: TrainingParameterType,
  level: TrainingLevelType,
  genderTag: GenderTag,
) => {
  let value: number | undefined;
  if (
    skillIntensity.startValue[valueName] &&
    skillIntensity.startValue[valueName].default
  ) {
    // set default
    value = skillIntensity.startValue[valueName].default.default;

    if (skillIntensity.startValue[valueName][genderTag]) {
      // more specific skill values
      value = skillIntensity.startValue[valueName][genderTag].default;
      if (skillIntensity.startValue[valueName][genderTag]?.[level]) {
        value = skillIntensity.startValue[valueName][genderTag][level];
      }
    }
  }
  if (
    branchExercise.values &&
    branchExercise.values[valueName] &&
    branchExercise.values[valueName].startValue
  ) {
    // more specific exercise values
    if (branchExercise.values[valueName].startValue.default) {
      if (branchExercise.values[valueName].startValue.default.default) {
        value = Number(
          branchExercise.values[valueName].startValue.default.default,
        );
      }
      if (branchExercise.values[valueName].startValue.default[level]) {
        value = Number(
          branchExercise.values[valueName].startValue.default[level],
        );
      }
    }
    if (branchExercise.values[valueName].startValue[genderTag]) {
      if (branchExercise.values[valueName].startValue[genderTag].default) {
        value = Number(
          branchExercise.values[valueName].startValue[genderTag].default,
        );
      }

      if (branchExercise.values[valueName].startValue[genderTag][level]) {
        value = Number(
          branchExercise.values[valueName].startValue[genderTag][level],
        );
      }
    }
  }

  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }

  console.log(`could not parse ${value} to number`);
  return undefined;
};

export const getValueByGenderAndLevel = (
  data: ValueType | undefined,
  gender: GenderTag,
  level: TrainingLevelType,
) => {
  let result: number | undefined;
  if (data) {
    // use default for gender
    if (data.default) {
      // use default for level
      if (data.default.default) result = +data.default.default;
      // use user level
      if (data.default[level]) result = +data.default[level];
    }
    // use default for gender
    if (data[gender]) {
      // use default for level
      if (data[gender].default) result = +data[gender].default;
      // use user level
      if (data[gender][level]) result = +data[gender][level];
    }
  }
  return result;
};

export const getStartValues = (
  data: ExerciseValues,
  gender: GenderTag,
  level: TrainingLevelType,
): { [valueType: string]: number } => {
  let result: Partial<
    Record<(typeof WorkoutConstants.VALUE_TYPE_NAMES)[number], number>
  > = {};
  for (let valueName of WorkoutConstants.VALUE_TYPE_NAMES) {
    if (data[valueName] && data[valueName].startValue) {
      //startValue entry for this value type exists
      result[valueName] = getValueByGenderAndLevel(
        data[valueName].startValue,
        gender,
        level,
      );
    }
  }
  return result;
};

/**
 *
 * @param skillTree
 * @param previousBranchId - the branch to replace OR the first both side branch to replace a single sided branch
 * @param oldBranch
 * @param level
 * @param branchIdsInUse - all branch ids in training to prevent doubles
 * @param equipment - available on given training day
 * @param ageGroup - of active user
 * @param userGender - of active user
 * @param prevRegions - of active training day
 * @param skill
 */
export const getEquivalentBranchWithGivenLevel = (
  skillTree: SkillTreeType,
  previousBranchId: string,
  oldBranch: ExerciseBranchType | SkillBranchType,
  level: number,
  branchIdsInUse: string[],
  equipment: string[],
  ageGroup: string,
  userGender: string,
  prevRegions: string[],
  skill: SkillCode,
): ExerciseBranchType | undefined => {
  // filter skill branches
  let availableBranches = filterByEquipment(skillTree, equipment).keep;
  availableBranches = filterByAge(availableBranches, ageGroup).keep;
  availableBranches = filterByGender(availableBranches, userGender).keep;
  if (skill.indexOf("PREV") > -1) {
    // filter prev to match current prevention
    availableBranches = filterByPrevention(availableBranches, prevRegions).keep;
  }

  // comparables
  const region = getTagValues(oldBranch.tags, TagGroups.REGION);
  const side = getTagValues(oldBranch.tags, TagGroups.SIDE);
  const exerciseDirection = getTagValues(
    oldBranch.tags,
    TagGroups.EXERCISE_DIRECTION,
  );
  let matchValues = [];
  let highestValue = 0;
  for (let id in availableBranches) {
    if (availableBranches.hasOwnProperty(id)) {
      let tags = availableBranches[id].tags;
      let levels = availableBranches[id].levels;
      let matchValue = 1;
      // has matching level
      if (!levels[level]) {
        let downgrade = 0.8;
        let availableLevel = level;
        let lowerLevelFound = false;
        while (availableLevel > 1 && downgrade > 0) {
          availableLevel--;
          if (levels[availableLevel]) {
            lowerLevelFound = true;
            break;
          }
          downgrade -= 0.2;
        }
        if (lowerLevelFound) {
          matchValue = matchValue * downgrade;
        } else {
          matchValue = 0;
        }
      }
      // matches age and gender
      if (id === previousBranchId || branchIdsInUse.includes(id)) {
        // do not use same branch again
        matchValue = 0;
      }
      // region
      let branchRegion = getTagValues(tags, TagGroups.REGION);
      if (
        region.length > 0 &&
        branchRegion.every((br) => region.indexOf(br) === -1)
      ) {
        //is other region
        matchValue = matchValue * 0.5;
      }
      // side
      let branchSide = getTagValues(tags, TagGroups.SIDE);
      if (side.length > 0 && prevRegions.length === 0) {
        // switching allowed for prevention
        if (side.indexOf("ONE") > -1 && branchSide.indexOf("BOTH") > -1) {
          // switch from one to both
          matchValue = matchValue * 0.8;
        } else if (
          side.indexOf("BOTH") > -1 &&
          branchSide.indexOf("ONE") > -1
        ) {
          // never switch from both to one
          matchValue = 0;
        }
      }
      // direction
      let branchDirection = getTagValues(tags, TagGroups.EXERCISE_DIRECTION);
      if (
        exerciseDirection.length > 0 &&
        branchDirection.every((bd) => exerciseDirection.indexOf(bd) === -1)
      ) {
        //is other direction
        matchValue = matchValue * 0.8;
      }

      // save match value
      if (matchValue > highestValue) highestValue = matchValue;
      matchValues.push({ id: id, value: matchValue });
    }
  }
  if (matchValues.length === 0 || matchValues.every((mv) => mv.value === 0)) {
    // no matching branch found
    return undefined;
  }
  let bestMatchingBranchIds = matchValues
    .filter((mv) => mv.value === highestValue)
    .map((f) => f.id);
  const branchId =
    bestMatchingBranchIds[
      Math.floor(Math.random() * bestMatchingBranchIds.length)
    ];
  let branch = availableBranches[branchId];

  return {
    tags: branch.tags,
    exercises: Object.fromEntries(
      Object.entries(branch.levels).map(([k, v]) => [Number(k), v]),
    ),
    branchId: branchId,
  };
};

/**
 * Returns max weight calculated by Eply formula based on used weight and completed reps
 *
 * @param weight
 * @param repetition
 */
export const maxWeightByEpley = (weight: number, repetition: number) => {
  return weight * (1 + repetition / 30);
};

/**
 * Returns adjusted max weights for given maxValue
 *
 * @param maxValue
 */
export const calculateAdjustedMaxValues = (maxValue: number): MaxValueType => {
  if (!isFinite(maxValue) || maxValue <= 0) {
    Logger.logError(
      new Error(
        `f:calculateAdjustedMaxValues ~ input: ${maxValue} is not a valid positive number`,
      ),
    );
    return {
      barbell: undefined,
      dumbbells: undefined,
      oneSidedUpper: undefined,
      oneSidedBarbell: undefined,
      oneSidedLower: undefined,
      oneSidedLowerSupported: undefined,
    };
  }

  const MAX_VALUE_DIGITS = 4;
  const roundDownTo = (value: number, digits: number) => {
    return Number.parseFloat(value.toFixed(digits));
  };

  const result: MaxValueType = {
    barbell: roundDownTo(maxValue, MAX_VALUE_DIGITS),
    dumbbells: roundDownTo(0.45 * maxValue, MAX_VALUE_DIGITS),
    oneSidedUpper: roundDownTo(0.45 * maxValue, MAX_VALUE_DIGITS),
    oneSidedBarbell: roundDownTo(0.45 * maxValue, MAX_VALUE_DIGITS),
    oneSidedLower: roundDownTo(0.5 * 0.45 * maxValue, MAX_VALUE_DIGITS), // 0.5 for weight on one KH, 0.45 for one leg
    oneSidedLowerSupported: roundDownTo(0.5 * 0.6 * maxValue, MAX_VALUE_DIGITS), // 0.5 for weight on one KH, 0.6 for exercise with one supported leg
  };

  return result;
};

export const deriveWeightForExercise = (
  weight: number,
  weightType: string | undefined,
  exercise: ExerciseType,
  maxValues: MaxValuesType,
) => {
  if (typeof weight !== "number" || !isFinite(weight)) {
    Logger.logError(
      new Error(
        `f:deriveWeightForExercise ~ weight: ${weight} is not a finite number`,
      ),
    );
    return undefined;
  }

  if (weightType === "weightFMax") {
    // calculate weight value based on given percentage in weight and max Value from test for given exercise
    const maxValue = getMaxValueForExercise(exercise, maxValues);

    if (typeof maxValue !== "number") {
      return undefined;
    }

    return roundWeightValue((weight / 100) * maxValue);
  }

  // given weight is absolute, so just round it
  return roundWeightValue(weight);
};

/**
 * Applies a calculated max value result to the appropriate directions in maxValues.
 * Updates the testDate to current date.
 */
export const applyMaxValueToDirections = (
  currentMaxValues: MaxValuesType,
  directions: string[],
  result: MaxValueType,
): MaxValuesType => {
  const updated = { ...currentMaxValues };

  for (const direction of directions) {
    const fieldName = EXERCISE_DIRECTIONS_VALUES_MAP[direction];
    if (fieldName) {
      updated[fieldName] = result;
    }
  }

  updated.testDate = Date.now();
  return updated;
};

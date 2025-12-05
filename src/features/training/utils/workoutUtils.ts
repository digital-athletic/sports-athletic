import { TagGroups } from "@/constants/tagGroups";
import { XP_PER_MINUTE } from "@/constants/userProgressConstants";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getTagValues } from "@/utils/tagUtils";
import { ExerciseType } from "../models/Exercise";
import {
  EXERCISE_DIRECTIONS_VALUES_MAP,
  MaxValuesType,
} from "../models/MaxValues";
import { TrainingTimeType } from "../models/Training";
import { UserExerciseDataType } from "../models/UserExerciseData";

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
      exerciseRegion === "UNTERKOERPER" ? "UNTERKOERPER" : "VERTICAL_PULL";
  }
  if (exerciseDirection === "SIDE") {
    exerciseDirection = "UNTERKOERPER";
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
        exerciseRegion === "OBERKOERPER"
          ? WorkoutConstants.MAX_VALUE_TYPES.ONE_SIDED_UPPER
          : WorkoutConstants.MAX_VALUE_TYPES.ONE_SIDED_LOWER;
    } else {
      maxType = WorkoutConstants.MAX_VALUE_TYPES.DUMBBELLS;
    }
  } else if (isOneSided) {
    maxType = WorkoutConstants.MAX_VALUE_TYPES.ONE_SIDED_BARBELL;
  }
  const directionKey = EXERCISE_DIRECTIONS_VALUES_MAP[exerciseDirection];
  const directionValues = directionKey ? maxValues[directionKey] : null;
  return directionValues ? directionValues[maxType] : null;
};

export const getRoundedResultForValueAndStep = (
  value: number,
  step: number,
) => {
  const remainder = value % step;
  return remainder < step / 2 ? value - remainder : value + step - remainder;
};

export const roundWeightValue = (value: number) => {
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
  points: number;
  weight: number;
  height: number;
} => {
  let duration = 0;
  let pauseDuration = 0;
  let count = 0;
  let points = 0;
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
            if (exercise.exerciseId === 999999) {
              // count pause duration - no points
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
        if (exercise.exerciseId !== 999999) {
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
    // calculate points from time without pause
    points = Math.round(((duration - time.pause) / 1000 / 60) * XP_PER_MINUTE);
    // switch to seconds for return
    duration = Math.ceil(duration / 1000);
  } else {
    // use old estimation
    points = (duration - pauseDuration) * XP_PER_MINUTE;
  }
  return {
    duration: duration,
    count: count,
    points: points,
    weight: weight,
    height: height,
  };
};

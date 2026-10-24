import { TagGroups } from "@/constants/tagGroups";
import {
  type MaxValueTypeName,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import {
  EXERCISE_DIRECTIONS_VALUES_MAP,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";

const readMaxValueType = (exercise: ExerciseType): MaxValueTypeName => {
  const { MAX_VALUE_TYPES, EQUIPMENT } = WorkoutConstants;
  const isOneSided = getTagValues(exercise.tags, TagGroups.SIDE).includes(
    "ONE",
  );
  const isUpperBody =
    getTagValues(exercise.tags, TagGroups.REGION)[0] === "UPPER_BODY";
  const isDumbbell = getTagValues(exercise.tags, TagGroups.EQUIPMENT).includes(
    EQUIPMENT.DUMBBELL,
  );
  if (!isOneSided) {
    return isDumbbell ? MAX_VALUE_TYPES.DUMBBELLS : MAX_VALUE_TYPES.BARBELL;
  }
  if (isUpperBody) return MAX_VALUE_TYPES.ONE_SIDED_UPPER;
  return isDumbbell
    ? MAX_VALUE_TYPES.ONE_SIDED_LOWER
    : MAX_VALUE_TYPES.ONE_SIDED_BARBELL;
};

/**
 * Reads the F-Max of the exercise: the barbell 1RM of its movement direction
 * times the factor the catalog authors for the exercise, else the generic
 * equipment conversion. Undefined without such a 1RM.
 */
export const readExerciseFMax = (
  exercise: ExerciseType,
  maxValues: MaxValuesType,
): number | undefined => {
  const direction = getTagValues(exercise.tags, TagGroups.EXERCISE_DIRECTION)[0];
  const directionKey = direction
    ? EXERCISE_DIRECTIONS_VALUES_MAP[direction]
    : undefined;
  const oneRepMax = directionKey ? maxValues[directionKey]?.barbell : undefined;
  if (typeof oneRepMax !== "number" || !isFinite(oneRepMax)) return undefined;
  const factor =
    exercise.conversionFactor ??
    WorkoutConstants.MAX_VALUE_CONVERSION_FACTORS[readMaxValueType(exercise)];
  return oneRepMax * factor;
};

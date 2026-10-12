import {
  type AgeGroupTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";

export const canTakeStrengthTest = (ageGroup: AgeGroupTag): boolean =>
  ageGroup !== WorkoutConstants.AGE_GROUPS.CHILD;

/** A test timestamp of 0 means no test yet, which makes the first test due. */
export const isStrengthTestDue = (
  testAt: number,
  now: number,
  ageGroup: AgeGroupTag,
): boolean =>
  canTakeStrengthTest(ageGroup) &&
  now - testAt >= WorkoutConstants.MAX_VALUES_EXPIRATION_TIME_IN_MS;

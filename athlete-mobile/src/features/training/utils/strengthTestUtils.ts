import { WorkoutConstants } from "@/constants/workoutConstants";

/** A test timestamp of 0 means no test yet, which makes the first test due. */
export const isStrengthTestDue = (testAt: number, now: number): boolean =>
  now - testAt >= WorkoutConstants.MAX_VALUES_EXPIRATION_TIME_IN_MS;

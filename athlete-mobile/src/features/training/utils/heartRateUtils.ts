/**
 * Heart rate utilities for cardio training exercises
 */

import { SkillTree, WorkoutConstants } from "@/constants/workoutConstants";
import { calculateAgeFromBirthday } from "@/utils/date";

export type HeartRateInterval = {
  low: number;
  high: number;
};

/**
 * Estimates the maximum heart rate from age with the Tanaka formula
 */
export const calculateMaxHeartRate = (age: number): number => {
  return 208 - 0.7 * age;
};

/**
 * Returns heart rate interval for given skill depending on the given birthday
 * @param birthday - Date of birth in ISO 8601 format (YYYY-MM-DD)
 */
export const heartRateBySkillAndBirthday = (
  skill: string,
  birthday: string,
): HeartRateInterval => {
  const age =
    calculateAgeFromBirthday(birthday) ??
    WorkoutConstants.HEART_RATE_DEFAULT_AGE;
  const maxFrequency = calculateMaxHeartRate(age);
  const range =
    WorkoutConstants.SKILL_TREE_HEART_RATES[skill as SkillTree] ||
    WorkoutConstants.SKILL_TREE_HEART_RATE_DEFAULT;

  return {
    low: Math.round(range.low * maxFrequency),
    high: Math.round(range.high * maxFrequency),
  };
};

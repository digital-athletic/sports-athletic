/**
 * Heart rate utilities for cardio training exercises
 * Calculates target heart rate zones based on age, skill level, and exercise type
 */

import { SkillTree, WorkoutConstants } from "@/constants/workoutConstants";

export type HeartRateInterval = {
  low: number;
  high: number;
};

/**
 * Calculate max heart rate based on age (Karvonen method)
 * Uses formula: 220 - age
 */
export const calculateMaxHeartRate = (age: number): number => {
  return 220 - age;
};

/**
 * Calculate resting heart rate (approximate)
 * Average value is 60-70 bpm for adults
 */
const RESTING_HEART_RATE = 65;

/**
 * Calculate target heart rate zone for cardio training
 * Uses percentage-based zones: easy (50-70%), moderate (70-85%), hard (85-95%)
 */
export const calculateHeartRateZone = (
  age: number,
  intensity: "EASY" | "MODERATE" | "HARD",
): HeartRateInterval => {
  const maxHR = calculateMaxHeartRate(age);
  const heartRateReserve = maxHR - RESTING_HEART_RATE;

  const zones: Record<typeof intensity, [number, number]> = {
    EASY: [0.5, 0.7],
    MODERATE: [0.7, 0.85],
    HARD: [0.85, 0.95],
  };

  const [minPercent, maxPercent] = zones[intensity];

  return {
    low: Math.round(RESTING_HEART_RATE + heartRateReserve * minPercent),
    high: Math.round(RESTING_HEART_RATE + heartRateReserve * maxPercent),
  };
};

/**
 * Determine exercise intensity based on skill type
 * Maps training skill to heart rate intensity
 */
export const getIntensityForSkill = (
  skill: string,
): "EASY" | "MODERATE" | "HARD" => {
  if (skill.includes("WARMUP")) return "EASY";
  if (skill.includes("CARDIO")) return "MODERATE";
  if (skill.includes("SWR") || skill.includes("STABILITY")) return "HARD";
  return "MODERATE";
};

/**
 * Calculate heart rate interval for a specific cardio exercise
 * @param age - User's age in years
 * @param skill - Exercise skill type (e.g., "CARDIO", "WARMUP")
 * @returns Heart rate interval {low, high} in bpm
 */
export const calculateHeartRateIntervalForExercise = (
  age: number,
  skill: string,
): HeartRateInterval => {
  const intensity = getIntensityForSkill(skill);
  return calculateHeartRateZone(age, intensity);
};

/**
 * Returns heart rate interval for given skill depending on the given birthday
 */
export const heartRateBySkillAndBirthday = (
  skill: string,
  birthday: string, // DD-MM-YYYY
) => {
  const birthYear = parseInt(birthday.split("-")[2], 10);

  if (isNaN(birthYear)) {
    return undefined;
  }

  const age = new Date().getFullYear() - birthYear;

  let maxFrequency = WorkoutConstants.HEART_RATE_MAX - age;
  let range =
    WorkoutConstants.SKILL_TREE_HEART_RATES[skill as SkillTree] ||
    WorkoutConstants.SKILL_TREE_HEART_RATE_DEFAULT;

  return {
    low: Math.round(range.low * maxFrequency),
    high: Math.round(range.high * maxFrequency),
  };
};

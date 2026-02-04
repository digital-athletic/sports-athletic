/**
 * Workouts profile - completed profile with pre-completed workouts.
 *
 * Use this profile for statistics/history tests that need workout data
 * without clicking through the workout flow.
 */

import { STORAGE_KEYS } from "../constants";
import {
  createCompletedWorkoutsStore,
  createSampleWorkout,
  createWorkoutWithSkills,
  createZeroXpWorkout,
} from "../data/completedWorkoutsStore";
import type { CompletedWorkout, StoreDataMap } from "../types";
import { createCompletedProfile } from "./completedProfile";

/**
 * Creates a profile with pre-completed workouts for statistics testing.
 *
 * Each seeded workout has:
 * - Duration: 1800s (30 min)
 * - XP: 50
 * - 2 exercises (1 with weight: 15kg × 10 reps × 3 sets = 450kg)
 *
 * @param workoutCount - Number of workouts to seed (default: 1)
 */
export function createWorkoutsProfile(workoutCount: number = 1): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const workouts: Record<string, CompletedWorkout> = {};
  for (let i = 0; i < workoutCount; i++) {
    const workout = createSampleWorkout(
      `workout-${i + 1}`,
      i * 60 * 60 * 1000, // 1 hour offset per workout
    );
    workouts[workout.id] = workout;
  }

  return {
    ...baseProfile,
    [STORAGE_KEYS.COMPLETED_WORKOUTS]: createCompletedWorkoutsStore({
      workouts,
    }),
  };
}

/** Time constants for workout age offsets */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Creates a profile with workouts at specific time intervals for testing
 * time scale filtering (week/month/year/total).
 *
 * Workouts created:
 * - "recent": 1 day ago (shows in all filters)
 * - "two-weeks-old": 10 days ago (shows in month, year, total - NOT week)
 * - "two-months-old": 45 days ago (shows in year, total - NOT week or month)
 *
 * Each workout has: 1800s duration, 50 XP, 450kg moved weight
 *
 * Expected totals by filter:
 * - Week: 1 workout (1800s, 50 XP, 450kg)
 * - Month: 2 workouts (3600s, 100 XP, 900kg)
 * - Year/Total: 3 workouts (5400s, 150 XP, 1350kg)
 */
export function createTimeFilteredWorkoutsProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const workouts: Record<string, CompletedWorkout> = {};

  // Recent workout - 1 day ago (visible in all filters)
  const recentWorkout = createSampleWorkout("recent", ONE_DAY_MS);
  workouts[recentWorkout.id] = recentWorkout;

  // 10 days old workout (visible in month, year, total - NOT week)
  const twoWeeksOldWorkout = createSampleWorkout(
    "two-weeks-old",
    10 * ONE_DAY_MS,
  );
  workouts[twoWeeksOldWorkout.id] = twoWeeksOldWorkout;

  // 45 days old workout (visible in year, total - NOT week or month)
  const twoMonthsOldWorkout = createSampleWorkout(
    "two-months-old",
    45 * ONE_DAY_MS,
  );
  workouts[twoMonthsOldWorkout.id] = twoMonthsOldWorkout;

  return {
    ...baseProfile,
    [STORAGE_KEYS.COMPLETED_WORKOUTS]: createCompletedWorkoutsStore({
      workouts,
    }),
  };
}

/**
 * Creates a profile with workouts that have xpEarned: 0.
 * Used to test the bug where workouts with 0 XP were incorrectly
 * marked as "test workouts" and had their summary hidden.
 *
 * Each seeded workout has:
 * - Duration: 1200s (20 min)
 * - XP: 0 (the bug scenario)
 * - 3 exercises
 * - Moved weight: 300kg
 */
export function createZeroXpWorkoutsProfile(
  workoutCount: number = 1,
): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const workouts: Record<string, CompletedWorkout> = {};
  for (let i = 0; i < workoutCount; i++) {
    const workout = createZeroXpWorkout(
      `zero-xp-workout-${i + 1}`,
      i * 60 * 60 * 1000,
    );
    workouts[workout.id] = workout;
  }

  return {
    ...baseProfile,
    [STORAGE_KEYS.COMPLETED_WORKOUTS]: createCompletedWorkoutsStore({
      workouts,
    }),
  };
}

/**
 * Creates a profile with workouts at different time intervals, each with
 * DIFFERENT skill distributions. Used for testing radar chart filtering.
 *
 * Workouts created:
 * - "recent": 1 day ago - Strength-focused (SWR: 60, others: 8 each = 100 total)
 * - "two-weeks-old": 10 days ago - Cardio-focused (CARDIO: 60, others: 8 each)
 * - "two-months-old": 45 days ago - Mobility-focused (MOBILITY: 60, others: 8 each)
 *
 * Expected radar chart percentages by filter:
 *
 * "Last week" (recent only):
 *   Strength: 60%, others: 8% each
 *
 * "Last month" (recent + two-weeks-old, totals: SWR=68, CARDIO=68, others=16 each):
 *   Total = 200, so: Strength: 34%, Endurance: 34%, others: 8% each
 *
 * "Total" (all 3 workouts, totals: SWR=76, CARDIO=76, MOBILITY=76, others=24 each):
 *   Total = 300, so: Strength: 25%, Endurance: 25%, Mobility: 25%, others: 8% each
 */
export function createRadarChartFilteringProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const workouts: Record<string, CompletedWorkout> = {};

  // Recent workout - 1 day ago - Strength-focused
  const recentWorkout = createWorkoutWithSkills("recent", ONE_DAY_MS, {
    MOBILITY: 8,
    PREVENTION: 8,
    CARDIO: 8,
    STABILITY: 8,
    WARMUP: 8,
    SWR: 60,
  });
  workouts[recentWorkout.id] = recentWorkout;

  // 10 days old workout - Cardio/Endurance-focused
  const twoWeeksOldWorkout = createWorkoutWithSkills(
    "two-weeks-old",
    10 * ONE_DAY_MS,
    {
      MOBILITY: 8,
      PREVENTION: 8,
      CARDIO: 60,
      STABILITY: 8,
      WARMUP: 8,
      SWR: 8,
    },
  );
  workouts[twoWeeksOldWorkout.id] = twoWeeksOldWorkout;

  // 45 days old workout - Mobility-focused
  const twoMonthsOldWorkout = createWorkoutWithSkills(
    "two-months-old",
    45 * ONE_DAY_MS,
    {
      MOBILITY: 60,
      PREVENTION: 8,
      CARDIO: 8,
      STABILITY: 8,
      WARMUP: 8,
      SWR: 8,
    },
  );
  workouts[twoMonthsOldWorkout.id] = twoMonthsOldWorkout;

  return {
    ...baseProfile,
    [STORAGE_KEYS.COMPLETED_WORKOUTS]: createCompletedWorkoutsStore({
      workouts,
    }),
  };
}

/**
 * Shared test constants for E2E mock data.
 */

export const TEST_DATE = "2026-01-21";

/**
 * Maximum strength test values for a male beginner.
 */
export const STRENGTH_TEST_MAX_VALUE = {
  barbell: 46.6667,
  dumbbells: 21,
  oneSidedUpper: 21,
  oneSidedBarbell: 21,
  oneSidedLower: 10.5,
  oneSidedLowerSupported: 14,
};

/**
 * Strength test results based on male beginner with 10 reps.
 * Epley formula: weight × (1 + reps/30), rounded to 0.5kg
 */
export const STRENGTH_TEST_RESULTS = {
  testDate: TEST_DATE,
  verticalPush: {
    barbell: 26.4,
    dumbbells: 11.88,
    oneSidedUpper: 11.88,
    oneSidedBarbell: 11.88,
    oneSidedLower: 5.94,
    oneSidedLowerSupported: 7.92,
  },
  verticalPull: {
    barbell: 26.4,
    dumbbells: 11.88,
    oneSidedUpper: 11.88,
    oneSidedBarbell: 11.88,
    oneSidedLower: 5.94,
    oneSidedLowerSupported: 7.92,
  },
  horizontalPush: {
    barbell: 36.6667,
    dumbbells: 16.5,
    oneSidedUpper: 16.5,
    oneSidedBarbell: 16.5,
    oneSidedLower: 8.25,
    oneSidedLowerSupported: 11,
  },
  horizontalPull: {
    barbell: 36.6667,
    dumbbells: 16.5,
    oneSidedUpper: 16.5,
    oneSidedBarbell: 16.5,
    oneSidedLower: 8.25,
    oneSidedLowerSupported: 11,
  },
  hip: STRENGTH_TEST_MAX_VALUE,
  knee: STRENGTH_TEST_MAX_VALUE,
  unterkoerper: STRENGTH_TEST_MAX_VALUE,
};

/**
 * Default user data for test profiles.
 */
export const DEFAULT_USER = {
  userId: "test-user-id",
  username: "Test User",
  gender: "MALE" as const,
  birthday: "1990-01-01",
  height: 180,
  weight: 80,
};

/**
 * Storage key constants.
 */
export const STORAGE_KEYS = {
  PLACES: "places-storage",
  USER_PROFILE: "user-profile-storage",
  USER_WORKOUT: "user-workout-storage",
  EXERCISE_PROGRESS: "exercise-progress-storage",
  TRAINING_SCHEDULE: "training-schedule-storage",
  ANAMNESIS: "anamnesis-storage",
  COMPLETED_WORKOUTS: "completed-workouts-storage",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

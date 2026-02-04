/**
 * Power test chart profile - multiple test results for LineChart visualization.
 *
 * Use this profile for e2e tests that verify the power test LineChart.
 */

import { STORAGE_KEYS, STRENGTH_TEST_MAX_VALUE } from "../constants";
import type { StoreDataMap } from "../types";
import { createCompletedProfile } from "./completedProfile";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";

/**
 * Creates a strength test result with specific values for each exercise.
 */
function createTestResult(
  testDate: string,
  values: {
    knee: number;
    benchPress: number;
    rowing: number;
    shoulderPress: number;
  },
) {
  return {
    testDate,
    verticalPush: {
      barbell: values.shoulderPress,
      dumbbells: values.shoulderPress * 0.45,
      oneSidedUpper: values.shoulderPress * 0.45,
      oneSidedBarbell: values.shoulderPress * 0.45,
      oneSidedLower: values.shoulderPress * 0.225,
      oneSidedLowerSupported: values.shoulderPress * 0.3,
    },
    verticalPull: {
      barbell: values.shoulderPress,
      dumbbells: values.shoulderPress * 0.45,
      oneSidedUpper: values.shoulderPress * 0.45,
      oneSidedBarbell: values.shoulderPress * 0.45,
      oneSidedLower: values.shoulderPress * 0.225,
      oneSidedLowerSupported: values.shoulderPress * 0.3,
    },
    horizontalPush: {
      barbell: values.benchPress,
      dumbbells: values.benchPress * 0.45,
      oneSidedUpper: values.benchPress * 0.45,
      oneSidedBarbell: values.benchPress * 0.45,
      oneSidedLower: values.benchPress * 0.225,
      oneSidedLowerSupported: values.benchPress * 0.3,
    },
    horizontalPull: {
      barbell: values.rowing,
      dumbbells: values.rowing * 0.45,
      oneSidedUpper: values.rowing * 0.45,
      oneSidedBarbell: values.rowing * 0.45,
      oneSidedLower: values.rowing * 0.225,
      oneSidedLowerSupported: values.rowing * 0.3,
    },
    hip: STRENGTH_TEST_MAX_VALUE,
    knee: {
      barbell: values.knee,
      dumbbells: values.knee * 0.45,
      oneSidedUpper: values.knee * 0.45,
      oneSidedBarbell: values.knee * 0.45,
      oneSidedLower: values.knee * 0.225,
      oneSidedLowerSupported: values.knee * 0.3,
    },
    unterkoerper: STRENGTH_TEST_MAX_VALUE,
  };
}

/**
 * Creates a profile with multiple power test results for LineChart visualization.
 *
 * Test results with progression over time:
 * - 2024-07-01: knee=60, benchPress=40, rowing=35, shoulderPress=25
 * - 2024-09-15: knee=80, benchPress=55, rowing=50, shoulderPress=35
 * - 2024-11-20: knee=100, benchPress=70, rowing=60, shoulderPress=45
 * - 2025-01-15: knee=115, benchPress=75, rowing=65, shoulderPress=50
 *
 * This shows progression in all exercises over 4 test dates,
 * perfect for verifying the LineChart displays correctly.
 */
export function createPowerTestChartProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const testHistory = [
    // Most recent first (store keeps them in descending date order)
    createTestResult("2025-01-15", {
      knee: 115,
      benchPress: 75,
      rowing: 65,
      shoulderPress: 50,
    }),
    createTestResult("2024-11-20", {
      knee: 100,
      benchPress: 70,
      rowing: 60,
      shoulderPress: 45,
    }),
    createTestResult("2024-09-15", {
      knee: 80,
      benchPress: 55,
      rowing: 50,
      shoulderPress: 35,
    }),
    createTestResult("2024-07-01", {
      knee: 60,
      benchPress: 40,
      rowing: 35,
      shoulderPress: 25,
    }),
  ];

  return {
    ...baseProfile,
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore({
      testHistory,
    }),
  };
}

/**
 * Creates a profile with a single power test result.
 *
 * Test result:
 * - 2025-01-15: knee=80, benchPress=60, rowing=50, shoulderPress=35
 *
 * This tests the single-data-point case where a line from origin is drawn.
 */
export function createSinglePowerTestProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const testHistory = [
    createTestResult("2025-01-15", {
      knee: 80,
      benchPress: 60,
      rowing: 50,
      shoulderPress: 35,
    }),
  ];

  return {
    ...baseProfile,
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore({
      testHistory,
    }),
  };
}

/**
 * Creates a profile with many power test results (9 data points) to test
 * how the chart handles crowded x-axis labels.
 *
 * Test results spanning ~2 years with realistic progression:
 * - 2023-03-10: Starting values (beginner)
 * - 2023-05-15: +10-15% improvement
 * - 2023-07-20: +5-10% improvement
 * - 2023-10-05: +5-8% improvement
 * - 2023-12-18: +5-8% improvement
 * - 2024-03-22: +5-8% improvement
 * - 2024-06-30: +5-8% improvement
 * - 2024-10-12: +5-8% improvement
 * - 2025-01-25: Current values (advanced)
 *
 * This tests:
 * - X-axis label crowding and potential overlap
 * - Chart spacing calculation with many data points
 * - Scrolling behavior if chart becomes too wide
 */
export function createManyPowerTestsProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  const testHistory = [
    // Most recent first (store keeps them in descending date order)
    createTestResult("2025-01-25", {
      knee: 140,
      benchPress: 100,
      rowing: 85,
      shoulderPress: 65,
    }),
    createTestResult("2024-10-12", {
      knee: 130,
      benchPress: 95,
      rowing: 80,
      shoulderPress: 60,
    }),
    createTestResult("2024-06-30", {
      knee: 120,
      benchPress: 88,
      rowing: 75,
      shoulderPress: 55,
    }),
    createTestResult("2024-03-22", {
      knee: 112,
      benchPress: 82,
      rowing: 70,
      shoulderPress: 52,
    }),
    createTestResult("2023-12-18", {
      knee: 105,
      benchPress: 76,
      rowing: 65,
      shoulderPress: 48,
    }),
    createTestResult("2023-10-05", {
      knee: 95,
      benchPress: 70,
      rowing: 60,
      shoulderPress: 44,
    }),
    createTestResult("2023-07-20", {
      knee: 85,
      benchPress: 62,
      rowing: 55,
      shoulderPress: 40,
    }),
    createTestResult("2023-05-15", {
      knee: 72,
      benchPress: 52,
      rowing: 48,
      shoulderPress: 35,
    }),
    createTestResult("2023-03-10", {
      knee: 60,
      benchPress: 45,
      rowing: 40,
      shoulderPress: 30,
    }),
  ];

  return {
    ...baseProfile,
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore({
      testHistory,
    }),
  };
}

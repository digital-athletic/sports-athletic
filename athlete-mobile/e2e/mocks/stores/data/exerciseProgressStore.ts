/**
 * Exercise progress store - exercise data, branch levels, XP.
 */

import { STRENGTH_TEST_RESULTS } from "../constants";
import type { ExerciseProgressState, ExerciseData, StoreState } from "../types";

export interface ExerciseProgressStoreOptions {
  exerciseData?: Record<string, ExerciseData>;
  branchData?: Record<string, { level: number }>;
  xp?: number;
  level?: number;
  testHistory?: unknown[];
}

export function createExerciseProgressStore(
  options: ExerciseProgressStoreOptions = {},
): StoreState<ExerciseProgressState> {
  const {
    exerciseData = {},
    branchData = {},
    xp = 100,
    level = 1,
    testHistory = [STRENGTH_TEST_RESULTS],
  } = options;

  return {
    state: {
      exerciseData,
      branchData,
      xp,
      level,
      testHistory,
    },
  };
}

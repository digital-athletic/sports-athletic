/**
 * Completed profile without test history.
 *
 * Use this profile for tests that need exercise progress
 * but without any prior strength test results.
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createCompletedProfile } from "./completedProfile";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";

/**
 * Creates a completed profile with empty test history.
 *
 * This is useful for testing the "empty state" of the Tests tab
 * without having to modify the profile in the test.
 */
export function createCompletedProfileWithoutTestHistory(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  return {
    ...baseProfile,
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore({
      testHistory: [],
    }),
  };
}

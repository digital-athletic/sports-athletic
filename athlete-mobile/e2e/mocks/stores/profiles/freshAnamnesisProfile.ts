/**
 * Fresh anamnesis profile - anamnesis completed but no strength test yet.
 *
 * Use this profile for tests that need to run a fresh strength test
 * without prior test history affecting results.
 *
 * Matches the profile created by profile-setup.spec.ts (Handball, Male, Competitive)
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createPlacesStore } from "../data/placesStore";
import { createUserProfileStore } from "../data/userProfileStore";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";
import { createTrainingScheduleStore } from "../data/trainingScheduleStore";
import { createAnamnesisStore } from "../data/anamnesisStore";

/**
 * Creates a profile with:
 * - Completed anamnesis (Handball, Male, Competitive)
 * - No prior strength test history (empty maxValues, empty testHistory)
 * - Training plan configured for Tuesday/Friday
 * - Studio equipment set up
 */
export function createFreshAnamnesisProfile(): StoreDataMap {
  return {
    [STORAGE_KEYS.PLACES]: createPlacesStore(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      anamnesisCompleted: true,
      isInInitialAnamnesis: false,
    }),
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
      sport: "HANDBALL_SPORT",
      maxValues: null,
    }),
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore({
      testHistory: [],
    }),
    [STORAGE_KEYS.TRAINING_SCHEDULE]: createTrainingScheduleStore(),
    [STORAGE_KEYS.ANAMNESIS]: createAnamnesisStore(),
  };
}

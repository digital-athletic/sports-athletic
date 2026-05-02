import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createPlacesStore } from "../data/placesStore";
import { createUserProfileStore } from "../data/userProfileStore";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";
import { createTrainingScheduleStore } from "../data/trainingScheduleStore";
import { createAnamnesisStore } from "../data/anamnesisStore";
import { createUserSettingsStore } from "../data/userSettingsStore";

/**
 * Completed profile with consent status 'missing'.
 * Simulates a pre-existing user who has not yet accepted the privacy policy.
 */
export function createMissingConsentProfile(): StoreDataMap {
  return {
    [STORAGE_KEYS.PLACES]: createPlacesStore(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      anamnesisCompleted: true,
      isInInitialAnamnesis: false,
    }),
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore(),
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore(),
    [STORAGE_KEYS.TRAINING_SCHEDULE]: createTrainingScheduleStore(),
    [STORAGE_KEYS.ANAMNESIS]: createAnamnesisStore(),
    [STORAGE_KEYS.USER_SETTINGS]: createUserSettingsStore({
      consentStatus: "missing",
    }),
  };
}

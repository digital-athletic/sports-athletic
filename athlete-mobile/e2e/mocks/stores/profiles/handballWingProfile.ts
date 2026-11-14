/**
 * Handball wing profile - a female athlete of a given age.
 *
 * Use this profile for tests whose result depends on sport, gender, position or age.
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createPlacesStore } from "../data/placesStore";
import { createUserProfileStore } from "../data/userProfileStore";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";
import { createTrainingScheduleStore } from "../data/trainingScheduleStore";
import { createAnamnesisStore } from "../data/anamnesisStore";
import { createUserSettingsStore } from "../data/userSettingsStore";

/** First day of the current month `age` years ago, so the athlete is exactly `age` years old today. */
function birthdayForAge(age: number): string {
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/**
 * Creates a completed profile with:
 * - A female handball athlete playing WING, born so that she is `age` years old today
 * - Training plan configured for Tuesday/Friday
 */
export function createHandballWingProfile(age: number): StoreDataMap {
  return {
    [STORAGE_KEYS.PLACES]: createPlacesStore(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      gender: "FEMALE",
      birthday: birthdayForAge(age),
      anamnesisCompleted: true,
      isInInitialAnamnesis: false,
    }),
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
      sport: "SPORT_HANDBALL",
      tags: { POSITION: ["WING"], LEVEL: ["BEGINNER"] },
    }),
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore(),
    [STORAGE_KEYS.TRAINING_SCHEDULE]: createTrainingScheduleStore(),
    [STORAGE_KEYS.ANAMNESIS]: createAnamnesisStore(),
    [STORAGE_KEYS.USER_SETTINGS]: createUserSettingsStore(),
  };
}

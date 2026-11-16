/**
 * Profile whose Tuesday workout plans two GKS exercises: LH-Kniebeuge
 * (exercise 25, with a picture file) and 4-Füßlerstand mit Band li
 * (exercise 1204, without one).
 */

import { STORAGE_KEYS, PLAN_START_DATE } from "../constants";
import type { StoreDataMap } from "../types";
import { createPlacesStore } from "../data/placesStore";
import { createUserProfileStore } from "../data/userProfileStore";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";
import { createTrainingScheduleStore } from "../data/trainingScheduleStore";
import { createAnamnesisStore } from "../data/anamnesisStore";
import { createUserSettingsStore } from "../data/userSettingsStore";

const GKS_TAGS = ["SKILL_STABILITY_BODY", "PLACE_STUDIO"];

const MISSING_PICTURE_TRAINING_PLAN = {
  start: PLAN_START_DATE.toISOString(),
  sections: [
    {
      start: PLAN_START_DATE.toISOString().split("T")[0],
      numOfWeeks: 3,
      type: "SWR1",
      cardioType: "CARDIO_3",
      trainings: [
        {
          weekday: 1,
          skills: {
            GKS: [
              {
                branchId: "513",
                tags: GKS_TAGS,
                exercises: { 1: { exerciseId: "25" } },
              },
              {
                branchId: "514",
                tags: GKS_TAGS,
                exercises: { 1: { exerciseId: "1204" } },
              },
            ],
          },
          lengths: { GKS: 15 },
          focus: "PHASE",
        },
      ],
    },
  ],
};

export function createMissingPictureProfile(): StoreDataMap {
  return {
    [STORAGE_KEYS.PLACES]: createPlacesStore(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      anamnesisCompleted: true,
      isInInitialAnamnesis: false,
    }),
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
      trainingPlan: MISSING_PICTURE_TRAINING_PLAN,
    }),
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore(),
    [STORAGE_KEYS.TRAINING_SCHEDULE]: createTrainingScheduleStore(),
    [STORAGE_KEYS.ANAMNESIS]: createAnamnesisStore(),
    [STORAGE_KEYS.USER_SETTINGS]: createUserSettingsStore(),
  };
}

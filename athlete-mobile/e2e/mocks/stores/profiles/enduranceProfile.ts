/**
 * Endurance profile for the CARDIO_4 workout (Ausdauer-Lauf, exercise 38).
 *
 * Use this profile for tests that verify endurance exercise behavior:
 * checkmark instead of timer, duration recorded from suggested value.
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

const CARDIO_4_TRAINING_PLAN = {
  start: PLAN_START_DATE.toISOString(),
  sections: [
    {
      start: PLAN_START_DATE.toISOString().split("T")[0],
      numOfWeeks: 3,
      type: "SWR1",
      cardioType: "CARDIO_4",
      trainings: [
        {
          weekday: 1,
          skills: {
            CARDIO_4: [
              {
                branchId: "579",
                tags: [
                  "SKILL_CARDIO",
                  "SKILL_CARDIO_4",
                  "PLACE_STUDIO",
                  "EQ_TREADMILL",
                ],
                exercises: {
                  1: { exerciseId: "38" },
                },
              },
            ],
          },
          lengths: { CARDIO_4: 30 },
          focus: "PHASE",
        },
      ],
    },
  ],
};

export function createEnduranceProfile(): StoreDataMap {
  return {
    [STORAGE_KEYS.PLACES]: createPlacesStore(),
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      anamnesisCompleted: true,
      isInInitialAnamnesis: false,
    }),
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
      trainingPlan: CARDIO_4_TRAINING_PLAN,
    }),
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore(),
    [STORAGE_KEYS.TRAINING_SCHEDULE]: createTrainingScheduleStore(),
    [STORAGE_KEYS.ANAMNESIS]: createAnamnesisStore(),
    [STORAGE_KEYS.USER_SETTINGS]: createUserSettingsStore(),
  };
}

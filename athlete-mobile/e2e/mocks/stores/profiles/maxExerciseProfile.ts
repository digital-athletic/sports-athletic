/**
 * MAX exercise profile - training plan with warmup, SWR, and MAX bench press.
 *
 * Use this profile for tests that verify MAX exercise level progression
 * (maxFRepetitions flow, level adjustments via TOO_EASY/TOO_HARD feedback).
 */

import { STORAGE_KEYS, PLAN_START_DATE } from "../constants";
import type { StoreDataMap } from "../types";
import { createCompletedProfile } from "./completedProfile";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createAnamnesisStore } from "../data/anamnesisStore";
import {
  createPlacesStore,
  DEFAULT_STUDIO_EQUIPMENT,
} from "../data/placesStore";

/**
 * Creates a profile with WU + SWR1 + MAX training plan:
 * - Advanced athlete, since beginners do not train max strength
 * - Standard warmup and SWR1 exercise (same as completedProfile)
 * - MAX branch 133 (KH-Bankdrücken / dumbbell bench press) at default level 2
 * - Exercise ID 8
 * - No prior exercise data → every working set starts its ladder
 * - Tuesday schedule
 */
export function createMaxExerciseProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  return {
    ...baseProfile,
    [STORAGE_KEYS.ANAMNESIS]: createAnamnesisStore({
      tags: { LEVEL: ["ADVANCED"], POSITION: ["FIELD"], PAIN: [] },
    }),
    [STORAGE_KEYS.PLACES]: createPlacesStore({
      studioEquipment: [
        ...DEFAULT_STUDIO_EQUIPMENT,
        "MULTIPLE_EXERCISING_BENCHES",
      ],
    }),
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
      tags: { POSITION: ["FIELD"], LEVEL: ["ADVANCED"] },
      trainingPlan: {
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
                  WU: [
                    {
                      branchId: "410",
                      tags: ["SKILL_WARM_UP", "PLACE_STUDIO"],
                      exercises: {
                        1: { exerciseId: "431" },
                        2: { exerciseId: "432" },
                        3: { exerciseId: "432" },
                      },
                    },
                  ],
                  SWR1: [
                    {
                      branchId: "22",
                      tags: ["SKILL_SWR", "PLACE_STUDIO", "EQ_DUMBBELL"],
                      exercises: {
                        1: { exerciseId: "118" },
                        2: { exerciseId: "118" },
                        3: { exerciseId: "261" },
                      },
                    },
                  ],
                  MAX: [
                    {
                      branchId: "133",
                      tags: [
                        "SKILL_MAX_KRAFT",
                        "PLACE_STUDIO",
                        "EQ_DUMBBELL",
                        "EQ_ADJUSTABLE_BENCH",
                        "EQ_BARBELL_BENCH",
                      ],
                      exercises: {
                        1: { exerciseId: "8" },
                        2: { exerciseId: "8" },
                        3: { exerciseId: "8" },
                      },
                    },
                  ],
                },
                lengths: { WU: 5, SWR1: 10, MAX: 15 },
                focus: "PHASE",
              },
            ],
          },
        ],
      },
    }),
  };
}

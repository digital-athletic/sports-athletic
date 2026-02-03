/**
 * Branch threshold profile - exercise at max values, ready for level up.
 *
 * Use this profile for tests that verify branch progression/level up behavior.
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createCompletedProfile } from "./completedProfile";
import { createExerciseProgressStore } from "../data/exerciseProgressStore";

/**
 * Creates a profile with exercise at max threshold, ready for branch level up.
 *
 * - Exercise 118 (KH-Frontkniebeuge) at target values (15 reps, 25 kg for male beginner)
 * - Branch 22 at level 2, so next level up goes to level 3 (exercise 261 LH-Frontkniebeuge)
 */
export function createBranchThresholdProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();

  return {
    ...baseProfile,
    [STORAGE_KEYS.EXERCISE_PROGRESS]: createExerciseProgressStore({
      exerciseData: {
        "118": {
          exerciseId: "118",
          skill: "SWR1",
          weight: 25,
          repetition: 15,
          weightType: "weightAbsolute",
        },
      },
      branchData: {
        "22": { level: 2 },
      },
    }),
  };
}

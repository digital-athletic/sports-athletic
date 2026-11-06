/**
 * Ended plan profile - the training plan ran from 6 July 2026 for 12 weeks.
 * The last completed workout was on 25 September 2026.
 *
 * The dates are fixed, so use this profile with page.clock.setFixedTime.
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import {
  createCompletedWorkoutsStore,
  createSampleWorkout,
} from "../data/completedWorkoutsStore";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createCompletedProfile } from "./completedProfile";

export function createEndedPlanProfile(): StoreDataMap {
  const baseProfile = createCompletedProfile();
  const lastWorkout = {
    ...createSampleWorkout("workout-1"),
    timestamp: new Date(2026, 8, 25, 18).getTime(),
  };

  return {
    ...baseProfile,
    [STORAGE_KEYS.USER_WORKOUT]: createUserWorkoutStore({
      seasonPhase: { type: "COMPETITION", endDate: "2026-09-28" },
      trainingPlan: {
        start: "2026-07-06",
        sections: [
          {
            start: "2026-07-06",
            numOfWeeks: 12,
            type: "SWR1",
            cardioType: "CARDIO_3",
            trainings: [],
          },
        ],
      },
    }),
    [STORAGE_KEYS.COMPLETED_WORKOUTS]: createCompletedWorkoutsStore({
      workouts: { [lastWorkout.id]: lastWorkout },
      workoutsList: [
        { id: lastWorkout.id, timestamp: lastWorkout.timestamp, summary: "" },
      ],
    }),
  };
}

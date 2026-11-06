/**
 * Ended plan profile - the training plan ran from 6 July 2026 for 12 weeks.
 *
 * The dates are fixed, so use this profile with page.clock.setFixedTime.
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createUserWorkoutStore } from "../data/userWorkoutStore";
import { createCompletedProfile } from "./completedProfile";

export function createEndedPlanProfile(): StoreDataMap {
  return {
    ...createCompletedProfile(),
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
  };
}

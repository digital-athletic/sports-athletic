/**
 * User workout store - training plan and workout configuration.
 */

import { STRENGTH_TEST_RESULTS } from "../constants";
import type { UserWorkoutState, StoreState } from "../types";

/**
 * Default training plan with Tuesday/Friday schedule.
 * Uses real branch IDs from JSON skill tree files.
 */
const DEFAULT_TRAINING_PLAN = {
  start: "2026-01-20T00:00:00.000Z",
  sections: [
    {
      start: "2026-01-20",
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
          },
          lengths: { WU: 5, SWR1: 10 },
          focus: "PHASE",
        },
      ],
    },
  ],
};

export interface UserWorkoutStoreOptions {
  sport?: string;
  tags?: Record<string, string[]>;
  seasonPhase?: {
    type: string;
    endDate: string;
    currentWeek?: number;
    totalWeeks?: number;
    numOfWeeks?: number;
  };
  trainingPlan?: typeof DEFAULT_TRAINING_PLAN;
  maxValues?: Record<string, unknown> | null;
}

const EMPTY_MAX_VALUES = {
  testDate: "1990-01-01",
  verticalPush: {},
  verticalPull: {},
  horizontalPush: {},
  horizontalPull: {},
  hip: {},
  knee: {},
  lowerBody: {},
};

export function createUserWorkoutStore(
  options: UserWorkoutStoreOptions = {},
): StoreState<UserWorkoutState> {
  const {
    sport = "SOCCER",
    tags = {
      POSITION: ["FIELD"],
      LEVEL: ["BEGINNER"],
    },
    seasonPhase = {
      type: "COMPETITION",
      endDate: "2026-12-31",
      currentWeek: 1,
      totalWeeks: 52,
    },
    trainingPlan = DEFAULT_TRAINING_PLAN,
    maxValues,
  } = options;

  return {
    state: {
      workoutData: {
        sport,
        tags,
        seasonPhase: {
          type: seasonPhase.type,
          endDate: seasonPhase.endDate,
          currentWeek: seasonPhase.currentWeek ?? 1,
          totalWeeks: seasonPhase.totalWeeks ?? 52,
          ...(seasonPhase.numOfWeeks && { numOfWeeks: seasonPhase.numOfWeeks }),
        },
        maxValues:
          maxValues === null
            ? EMPTY_MAX_VALUES
            : (maxValues ?? STRENGTH_TEST_RESULTS),
      },
      trainingPlan,
      temporalData: undefined,
    },
  };
}

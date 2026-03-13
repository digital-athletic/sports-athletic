/**
 * User workout store - training plan and workout configuration.
 */

import {
  STRENGTH_TEST_RESULTS,
  PLAN_START_DATE,
  SEASON_END_DATE,
} from "../constants";
import type { UserWorkoutState, StoreState } from "../types";

/**
 * Default training plan with Tuesday/Friday schedule.
 * Uses real branch IDs from JSON skill tree files.
 * Dates are computed dynamically so the plan never expires.
 */
const DEFAULT_TRAINING_PLAN = {
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
          },
          lengths: { WU: 5, SWR1: 10 },
          focus: "PHASE",
        },
      ],
    },
  ],
};

export interface TrainingPlan {
  start: string;
  sections: {
    start: string;
    numOfWeeks: number;
    type: string;
    cardioType: string;
    trainings: {
      weekday: number;
      skills: Record<
        string,
        {
          branchId: string;
          tags: string[];
          exercises: Record<string, { exerciseId: string }>;
        }[]
      >;
      lengths: Record<string, number>;
      focus: string;
    }[];
  }[];
}

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
  trainingPlan?: TrainingPlan;
  maxValues?: Record<string, unknown> | null;
}

const EMPTY_MAX_VALUES = {
  testAt: 0,
  verticalPush: {},
  verticalPull: {},
  horizontalPush: {},
  horizontalPull: {},
  hipHinge: {},
  kneeDominant: {},
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
      endDate: SEASON_END_DATE,
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

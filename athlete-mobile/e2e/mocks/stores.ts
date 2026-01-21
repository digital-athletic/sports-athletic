import { type Page } from "@playwright/test";

/**
 * Store data representing a completed profile (anamnesis) and strength test.
 * Based on male beginner with 10 reps for all strength test exercises.
 *
 * Strength test results (Epley formula: weight × (1 + reps/30), rounded to 0.5kg):
 * - Squat: 35kg × 1.333 = 46.5 kg
 * - Bench press: (12.5kg × 2 × 1.1) × 1.333 = 36.5 kg
 * - Rowing: (12.5kg × 2 × 1.1) × 1.333 = 36.5 kg
 * - Shoulder press: (9kg × 2 × 1.1) × 1.333 = 26.5 kg
 */

const TEST_DATE = "21-01-2026";

const STRENGTH_TEST_MAX_VALUE = {
  barbell: 46.6667,
  dumbbells: 21,
  oneSidedUpper: 21,
  oneSidedBarbell: 21,
  oneSidedLower: 10.5,
  oneSidedLowerSupported: 14,
};

const STRENGTH_TEST_RESULTS = {
  testDate: TEST_DATE,
  verticalPush: {
    barbell: 26.4,
    dumbbells: 11.88,
    oneSidedUpper: 11.88,
    oneSidedBarbell: 11.88,
    oneSidedLower: 5.94,
    oneSidedLowerSupported: 7.92,
  },
  verticalPull: {
    barbell: 26.4,
    dumbbells: 11.88,
    oneSidedUpper: 11.88,
    oneSidedBarbell: 11.88,
    oneSidedLower: 5.94,
    oneSidedLowerSupported: 7.92,
  },
  horizontalPush: {
    barbell: 36.6667,
    dumbbells: 16.5,
    oneSidedUpper: 16.5,
    oneSidedBarbell: 16.5,
    oneSidedLower: 8.25,
    oneSidedLowerSupported: 11,
  },
  horizontalPull: {
    barbell: 36.6667,
    dumbbells: 16.5,
    oneSidedUpper: 16.5,
    oneSidedBarbell: 16.5,
    oneSidedLower: 8.25,
    oneSidedLowerSupported: 11,
  },
  hip: STRENGTH_TEST_MAX_VALUE,
  knee: STRENGTH_TEST_MAX_VALUE,
  unterkoerper: STRENGTH_TEST_MAX_VALUE,
};

// Note: exercises-storage and skill-trees-storage are NOT seeded
// because the app loads them from JSON files at runtime.
// The training plan references real branch IDs from those JSON files.

const STORE_DATA = {
  "places-storage": {
    state: {
      places: {
        STUDIO: {
          equipment: [
            "EQ_DUMBBELL",
            "EQ_BARBELL",
            "EQ_BENCH",
            "EQ_ADJUSTABLE_BENCH",
            "EQ_BARBELL_BENCH",
            "EQ_EXERCISING_BENCH",
            "EQ_POWER_RACK",
          ],
        },
      },
    },
    version: 0,
  },

  "user-profile-storage": {
    state: {
      userId: "test-user-id",
      personalData: {
        username: "Test User",
        gender: "MALE",
        birthday: "01-01-1990",
      },
      isInInitialAnamnesis: false,
      anamnesisCompleted: true,
      teamId: null,
    },
    version: 0,
  },

  "user-workout-storage": {
    state: {
      workoutData: {
        anamnesisCompleted: true,
        gender: "MALE",
        birthday: "01-01-1990",
        weight: 80,
        height: 180,
        sport: "SOCCER",
        tags: ["POSITION_FIELD", "LEVEL_BEGINNER"],
        seasonPhase: {
          type: "COMPETITION",
          endDate: "31-12-2026",
          currentWeek: 1,
          totalWeeks: 52,
        },
        maxValues: STRENGTH_TEST_RESULTS,
      },
      trainingPlan: {
        start: "2026-01-20T00:00:00.000Z",
        sections: [
          {
            start: "20-01-2026",
            numOfWeeks: 3,
            type: "SWR1",
            cardioType: "ZONE_3",
            trainings: [
              {
                weekday: 1,
                skills: {
                  // Branch IDs from actual JSON skill tree files
                  WU: [
                    {
                      exerciseBranchId: "410", // WU.json branch 410 -> exercise 431
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
                      exerciseBranchId: "22", // SWR1.json branch 22 -> exercise 118
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
      },
      temporalData: undefined,
    },
    version: 0,
  },

  "exercise-progress-storage": {
    state: {
      exerciseData: {},
      branchData: {},
      xp: 100,
      level: 1,
      testHistory: [STRENGTH_TEST_RESULTS],
    },
    version: 0,
  },

  "training-schedule-storage": {
    state: {
      trainingDays: [
        { active: false, weekday: 0, duration: 30, place: "STUDIO" },
        { active: true, weekday: 1, duration: 30, place: "STUDIO" }, // Tuesday
        { active: false, weekday: 2, duration: 30, place: "STUDIO" },
        { active: false, weekday: 3, duration: 30, place: "STUDIO" },
        { active: true, weekday: 4, duration: 30, place: "STUDIO" }, // Friday
        { active: false, weekday: 5, duration: 30, place: "STUDIO" },
        { active: false, weekday: 6, duration: 30, place: "STUDIO" },
      ],
    },
    version: 0,
  },

  "anamnesis-storage": {
    state: {
      values: {
        height: 180,
        weight: 80,
      },
      tags: {
        LEVEL: ["BEGINNER"],
        POSITION: ["FIELD"],
        PAIN: [],
      },
      originPath: undefined,
      seasonPhase: {
        type: "COMPETITION",
        endDate: "31-12-2026",
      },
    },
    version: 0,
  },
};

/**
 * Seeds all stores with completed profile and strength test data.
 * Call this before page.goto() to have stores pre-populated.
 */
export async function seedCompletedProfile(page: Page) {
  await page.addInitScript((stores) => {
    for (const [key, value] of Object.entries(stores)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, STORE_DATA);
}

/**
 * Seeds specific stores with custom data.
 */
export async function seedStores(page: Page, stores: Record<string, unknown>) {
  await page.addInitScript((storeData) => {
    for (const [key, value] of Object.entries(storeData)) {
      localStorage.setItem(key, JSON.stringify({ state: value, version: 0 }));
    }
  }, stores);
}

/**
 * Clears all app stores from localStorage.
 */
export async function clearStores(page: Page) {
  await page.addInitScript(() => {
    const storeKeys = [
      "user-profile-storage",
      "user-workout-storage",
      "exercise-progress-storage",
      "training-schedule-storage",
      "anamnesis-storage",
    ];
    for (const key of storeKeys) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Seeds profile with exercise at max threshold ready for branch level up.
 * Exercise 118 (KH-Frontkniebeuge) at target values (15 reps, 25 kg for male beginner)
 * Branch 22 at level 2, so next level up goes to level 3 (exercise 261 LH-Frontkniebeuge)
 */
export async function seedProfileAtBranchThreshold(page: Page) {
  const storesWithThreshold = {
    ...STORE_DATA,
    "exercise-progress-storage": {
      state: {
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
          "22": { level: 2 }, // Level 2, next level up goes to level 3 (exercise 261)
        },
        xp: 100,
        level: 1,
        testHistory: [STRENGTH_TEST_RESULTS],
      },
      version: 0,
    },
  };

  await page.addInitScript((stores) => {
    for (const [key, value] of Object.entries(stores)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, storesWithThreshold);
}

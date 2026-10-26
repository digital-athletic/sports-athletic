import type { TestSetLoads } from "@/schemas/generator.schema";
import type { OneRepMaxShares } from "@/schemas/oneRepMaxShares.schema";
import type { ExercisesBlock } from "@/schemas/strengthTestTemplate.schema";

export type TestSets = NonNullable<ExercisesBlock["testSets"]>;

/**
 * Builds the test sets of the bundled TEST template: three ramp up sets and
 * the AMRAP test set.
 *
 * generateBundledTestSets()
 * → [{ share: 0.4, repetitions: 6, rest: 60 }, { share: 0.6, repetitions: 4, rest: 60 },
 *    { share: 0.85, repetitions: 2, rest: 120 }, { share: 1, repetitions: "amrap", rest: 180 }]
 */
export const generateBundledTestSets = (): TestSets => [
  { share: 0.4, repetitions: 6, rest: 60 },
  { share: 0.6, repetitions: 4, rest: 60 },
  { share: 0.85, repetitions: 2, rest: 120 },
  { share: 1, repetitions: "amrap", rest: 180 },
];

/**
 * Builds test sets that differ from every bundled value: a half load set of
 * 8 repetitions and an AMRAP set.
 *
 * generateAuthoredTestSets()
 * → [{ share: 0.5, repetitions: 8, rest: 45 }, { share: 1, repetitions: "amrap", rest: 90 }]
 */
export const generateAuthoredTestSets = (): TestSets => [
  { share: 0.5, repetitions: 8, rest: 45 },
  { share: 1, repetitions: "amrap", rest: 90 },
];

/**
 * Builds the authored test set loads of the lifts 25 and 54, by gender and
 * level. The overrides replace whole lifts.
 *
 * generateTestSetLoads()["25"].m
 * → { beginner: 40, advanced: 60, professional: 80 }
 */
export const generateTestSetLoads = (
  overrides: TestSetLoads = {},
): TestSetLoads => ({
  "25": {
    m: { beginner: 40, advanced: 60, professional: 80 },
    w: { beginner: 30, advanced: 45, professional: 60 },
  },
  "54": {
    m: { beginner: 25, advanced: 30, professional: 40 },
    w: { beginner: 15, advanced: 20, professional: 25 },
  },
  ...overrides,
});

/**
 * Builds the 1RM shares of the strength test with one value per level; the
 * overrides replace single levels.
 *
 * generateOneRepMaxShares({ advanced: 0.9 })
 * → { beginner: 0.5, advanced: 0.9, professional: 0.5 }
 */
export const generateOneRepMaxShares = (
  overrides: Partial<OneRepMaxShares> = {},
): OneRepMaxShares => ({
  beginner: 0.5,
  advanced: 0.5,
  professional: 0.5,
  ...overrides,
});

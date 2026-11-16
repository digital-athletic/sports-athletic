import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import {
  type SportTest,
  type SportTestReferenceValue,
  type SportTestTranslations,
} from "./models/SportTest";

/**
 * A reference value for a female wing player aged 13 to 14, e.g.
 * generateReferenceValue({ gender: "MALE" }) returns
 * { gender: "MALE", position: "WING", trainingStage: "GRUNDLAGENTRAINING", minAge: 13, maxAge: 14, rangeStart: 9.87, rangeEnd: 6.54 }
 */
export const generateReferenceValue = (
  overrides: Partial<SportTestReferenceValue> = {},
): SportTestReferenceValue => ({
  gender: "FEMALE",
  position: "WING",
  trainingStage: "GRUNDLAGENTRAINING",
  minAge: 13,
  maxAge: 14,
  rangeStart: 9.87,
  rangeEnd: 6.54,
  ...overrides,
});

/**
 * A sport test measured in seconds, e.g. generateSportTest("FAKE_TEST_A") returns
 * { id: "id-FAKE_TEST_A", code: "FAKE_TEST_A", unit: "s", referenceValues: [], translations: {} }
 */
export const generateSportTest = (
  code: string,
  referenceValues: SportTestReferenceValue[] = [],
  translations: SportTestTranslations = {},
): SportTest => ({
  id: `id-${code}`,
  code,
  unit: "s",
  referenceValues,
  translations,
});

/**
 * An entered 5 m sprint value of 8.1 seconds in handball, e.g. generatePerformanceTestValue({ value: 10.2, date: "2026-03-05" })
 * returns { id: "id-2026-03-01-8.1", sport: "SPORT_HANDBALL", testCode: "SPRINT_5M", date: "2026-03-05", value: 10.2 }
 */
export const generatePerformanceTestValue = (
  overrides: Partial<PerformanceTestValue> = {},
): PerformanceTestValue => ({
  id: "id-2026-03-01-8.1",
  sport: "SPORT_HANDBALL",
  testCode: "SPRINT_5M",
  date: "2026-03-01",
  value: 8.1,
  ...overrides,
});

/** The day the specs of this feature freeze the clock on, a Saturday in November 2026. */
export const FROZEN_NOW = new Date(2026, 10, 14, 12);

/** Birthday of an athlete who is 14 on FROZEN_NOW. */
export const BIRTHDAY_AT_14 = "2012-11-01";

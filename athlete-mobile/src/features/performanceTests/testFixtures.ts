import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";

/**
 * A reference value for a female wing player in Grundlagentraining, e.g.
 * generateReferenceValue({ gender: "MALE" }) returns
 * { gender: "MALE", position: "WING", trainingStage: "GRUNDLAGENTRAINING", rangeStart: 9.87, rangeEnd: 6.54 }
 */
export const generateReferenceValue = (
  overrides: Partial<SportTestReferenceValue> = {},
): SportTestReferenceValue => ({
  gender: "FEMALE",
  position: "WING",
  trainingStage: "GRUNDLAGENTRAINING",
  rangeStart: 9.87,
  rangeEnd: 6.54,
  ...overrides,
});

/**
 * A sport test measured in seconds, e.g. generateSportTest("FAKE_TEST_A") returns
 * { id: "id-FAKE_TEST_A", code: "FAKE_TEST_A", unit: "s", referenceValues: [] }
 */
export const generateSportTest = (
  code: string,
  referenceValues: SportTestReferenceValue[] = [],
): SportTest => ({
  id: `id-${code}`,
  code,
  unit: "s",
  referenceValues,
});

/**
 * An entered value of 8.1 seconds, e.g. generatePerformanceTestValue({ value: 10.2, date: "2026-03-05" })
 * returns { id: "id-2026-03-01-8.1", date: "2026-03-05", value: 10.2 }
 */
export const generatePerformanceTestValue = (
  overrides: Partial<PerformanceTestValue> = {},
): PerformanceTestValue => ({
  id: "id-2026-03-01-8.1",
  date: "2026-03-01",
  value: 8.1,
  ...overrides,
});

/** The day the specs of this feature freeze the clock on, a Saturday in November 2026. */
export const FROZEN_NOW = new Date(2026, 10, 14, 12);

/** Birthday of an athlete who is 14 on FROZEN_NOW and so in Grundlagentraining (female handball). */
export const BIRTHDAY_AT_14 = "2012-11-01";

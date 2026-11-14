import { formatDateToISO } from "@/utils/date";
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

/**
 * ISO birthday that makes the athlete exactly the given age today, e.g.
 * on 2026-11-14 and age 14 it returns "2012-11-01".
 */
export const generateBirthdayForAge = (age: number): string => {
  const today = new Date();
  return formatDateToISO(
    new Date(today.getFullYear() - age, today.getMonth(), 1),
  );
};

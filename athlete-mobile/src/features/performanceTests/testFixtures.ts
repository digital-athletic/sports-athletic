import {
  type SportTest,
  type SportTestReferenceValue,
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

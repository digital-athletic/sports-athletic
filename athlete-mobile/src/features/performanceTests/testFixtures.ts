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

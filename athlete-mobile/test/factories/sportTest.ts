import {
  type SportTest,
  type SportTestReferenceValue,
  type SportTestTranslations,
} from "@/features/performanceTests/models/SportTest";

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
 * A sport test measured in seconds without a category, e.g. generateSportTest("FAKE_TEST_A") returns
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

/** A test of the given category with one reference value, e.g. generateCategorizedTest("FAKE_TEST_A", "ENDURANCE"). */
export const generateCategorizedTest = (
  code: string,
  category: string,
): SportTest => ({
  ...generateSportTest(code, [generateReferenceValue()]),
  category,
});

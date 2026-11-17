export type SportTestReferenceValue = {
  gender: "MALE" | "FEMALE";
  position: string;
  trainingStage: string;
  minAge: number;
  maxAge: number;
  rangeStart: number;
  rangeEnd: number;
};

export type SportTest = {
  id: string;
  code: string;
  unit: string;
  /**
   * Free text code such as SPEED. Known codes have a translation and an icon.
   * Undefined when the database row has no category. Only the unfiltered list shows such a test.
   */
  category?: string;
  referenceValues: SportTestReferenceValue[];
  translations: SportTestTranslations;
};

/** The name of a test in one language and, optionally, its unit in that language. */
export type SportTestTranslation = { name: string; unit?: string };

/** Translations by lower case ISO 639-1 language code, e.g. { en: { name: "5 m sprint" } }. */
export type SportTestTranslations = Partial<
  Record<string, SportTestTranslation>
>;

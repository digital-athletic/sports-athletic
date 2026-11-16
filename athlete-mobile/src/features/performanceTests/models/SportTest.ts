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
  referenceValues: SportTestReferenceValue[];
  translations: SportTestTranslations;
};

/** The name of a test in one language and, optionally, its unit in that language. */
export type SportTestTranslation = { name: string; unit?: string };

/** Translations by lower case ISO 639-1 language code, e.g. { en: { name: "5 m sprint" } }. */
export type SportTestTranslations = Partial<
  Record<string, SportTestTranslation>
>;

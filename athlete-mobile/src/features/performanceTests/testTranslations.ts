import { type SportTest } from "./models/SportTest";

/** "de-DE" and "DE-de" both become "de", the key of the translations. */
function toLanguageCode(language: string): string {
  return language.split("-")[0].toLowerCase();
}

/** The name in the language, else the English name, else the test code. */
export function resolveTestName(test: SportTest, language: string): string {
  const { translations } = test;
  return (
    translations[toLanguageCode(language)]?.name ??
    translations.en?.name ??
    test.code
  );
}

/** The unit in the language, else the stored unit. The English unit is no fallback. */
export function resolveTestUnit(test: SportTest, language: string): string {
  return test.translations[toLanguageCode(language)]?.unit ?? test.unit;
}

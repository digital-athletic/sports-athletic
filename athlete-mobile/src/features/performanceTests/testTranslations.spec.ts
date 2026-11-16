import { type SportTest } from "./models/SportTest";
import { generateSportTest } from "./testFixtures";
import { resolveTestName, resolveTestUnit } from "./testTranslations";

/**
 * A test in seconds with an English and a German name, the German one with a unit, e.g.
 * { code: "FAKE_TEST_A", unit: "s", translations: { en: { name: "Fake test" }, de: { name: "Fake-Test", unit: "rel. 1RM" } } }
 */
const generateTranslatedTest = (): SportTest =>
  generateSportTest("FAKE_TEST_A", [], {
    en: { name: "Fake test" },
    de: { name: "Fake-Test", unit: "rel. 1RM" },
  });

describe("resolveTestName", () => {
  it("returns the name in the language of the athlete", () => {
    expect(resolveTestName(generateTranslatedTest(), "de")).toBe("Fake-Test");
  });

  it("returns the English name when the language has no translation", () => {
    expect(resolveTestName(generateTranslatedTest(), "fr")).toBe("Fake test");
  });

  it("returns the code when the test has no translations", () => {
    expect(resolveTestName(generateSportTest("FAKE_TEST_A"), "de")).toBe(
      "FAKE_TEST_A",
    );
  });

  it("returns the code when the test has neither the language nor an English name", () => {
    const test = generateSportTest("FAKE_TEST_A", [], {
      de: { name: "Fake-Test" },
    });

    expect(resolveTestName(test, "fr")).toBe("FAKE_TEST_A");
  });

  it("uses the part before the dash of a region tag like de-DE", () => {
    expect(resolveTestName(generateTranslatedTest(), "de-DE")).toBe(
      "Fake-Test",
    );
  });

  it("lower cases the language, so DE-de finds the de translation", () => {
    expect(resolveTestName(generateTranslatedTest(), "DE-de")).toBe(
      "Fake-Test",
    );
  });
});

describe("resolveTestUnit", () => {
  it("returns the translated unit in the language of the athlete", () => {
    expect(resolveTestUnit(generateTranslatedTest(), "de")).toBe("rel. 1RM");
  });

  it("returns the stored unit when the language has no unit", () => {
    const test = generateSportTest("FAKE_TEST_A", [], {
      en: { name: "Fake test" },
      de: { name: "Fake-Test" },
    });

    expect(resolveTestUnit(test, "de")).toBe("s");
  });

  it("returns the stored unit when the test has no translations", () => {
    expect(resolveTestUnit(generateSportTest("FAKE_TEST_A"), "de")).toBe("s");
  });

  it("returns the stored unit instead of the English unit when the language has no translation", () => {
    const test = generateSportTest("FAKE_TEST_A", [], {
      en: { name: "Fake test", unit: "rel. 1RM" },
    });

    expect(resolveTestUnit(test, "fr")).toBe("s");
  });

  it("uses the part before the dash of a region tag like de-DE", () => {
    expect(resolveTestUnit(generateTranslatedTest(), "de-DE")).toBe("rel. 1RM");
  });
});

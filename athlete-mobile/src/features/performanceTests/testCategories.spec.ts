import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import IconBolt from "@tabler/icons-react-native/IconBolt";
import IconHeartbeat from "@tabler/icons-react-native/IconHeartbeat";
import IconRun from "@tabler/icons-react-native/IconRun";
import IconStopwatch from "@tabler/icons-react-native/IconStopwatch";
import { type TFunction } from "i18next";
import i18n from "@/i18n";
import { type SportTest } from "./models/SportTest";
import {
  generateCategorizedTest,
  generateSportTest,
} from "@test/factories/sportTest";
import {
  categoriesOfTests,
  categoryIcon,
  filterTestsByCategory,
  resolveCategoryLabel,
} from "./testCategories";

const codesOf = (tests: SportTest[]) => tests.map((test) => test.code);

describe("categoryIcon", () => {
  it.each([
    ["SPEED", IconRun],
    ["EXPLOSIVE_POWER", IconBolt],
    ["MAXIMUM_STRENGTH", IconBarbell],
    ["ENDURANCE", IconHeartbeat],
  ])("returns the matching icon for %s", (category, icon) => {
    expect(categoryIcon(category)).toBe(icon);
  });

  it("returns the stopwatch for an unknown category", () => {
    expect(categoryIcon("FAKE_CATEGORY")).toBe(IconStopwatch);
  });

  it("returns the stopwatch for a test without a category", () => {
    expect(categoryIcon(undefined)).toBe(IconStopwatch);
  });
});

describe("resolveCategoryLabel", () => {
  it("returns the English label of a known category", () => {
    const t = i18n.getFixedT("en");

    expect(resolveCategoryLabel("EXPLOSIVE_POWER", t)).toBe("Explosive power");
  });

  it("returns the German label of a known category", () => {
    const t = i18n.getFixedT("de");

    expect(resolveCategoryLabel("MAXIMUM_STRENGTH", t)).toBe("Maximalkraft");
  });

  it("returns the code when the category has no translation", () => {
    const t = i18n.getFixedT("en");

    expect(resolveCategoryLabel("FAKE_CATEGORY", t)).toBe("FAKE_CATEGORY");
  });
});

describe("resolveCategoryLabel with separators in the code", () => {
  it.each(["FAKE.CATEGORY", "more:FAKE"])(
    "returns %s itself without a lookup",
    (code) => {
      const t = jest.fn();

      expect(resolveCategoryLabel(code, t as unknown as TFunction)).toBe(code);
      expect(t).not.toHaveBeenCalled();
    },
  );
});

describe("categoriesOfTests", () => {
  it("returns an empty list for no tests", () => {
    expect(categoriesOfTests([])).toEqual([]);
  });

  it("lists each category once", () => {
    const tests = [
      generateCategorizedTest("FAKE_TEST_A", "SPEED"),
      generateCategorizedTest("FAKE_TEST_B", "SPEED"),
    ];

    expect(categoriesOfTests(tests)).toEqual(["SPEED"]);
  });

  it("puts the known categories in their display order", () => {
    const tests = [
      generateCategorizedTest("FAKE_TEST_A", "ENDURANCE"),
      generateCategorizedTest("FAKE_TEST_B", "MAXIMUM_STRENGTH"),
      generateCategorizedTest("FAKE_TEST_C", "EXPLOSIVE_POWER"),
      generateCategorizedTest("FAKE_TEST_D", "SPEED"),
    ];

    expect(categoriesOfTests(tests)).toEqual([
      "SPEED",
      "EXPLOSIVE_POWER",
      "MAXIMUM_STRENGTH",
      "ENDURANCE",
    ]);
  });

  it("puts unknown categories after the known ones, sorted by code", () => {
    const tests = [
      generateCategorizedTest("FAKE_TEST_A", "FAKE_CATEGORY_B"),
      generateCategorizedTest("FAKE_TEST_B", "ENDURANCE"),
      generateCategorizedTest("FAKE_TEST_C", "FAKE_CATEGORY_A"),
      generateCategorizedTest("FAKE_TEST_D", "SPEED"),
    ];

    expect(categoriesOfTests(tests)).toEqual([
      "SPEED",
      "ENDURANCE",
      "FAKE_CATEGORY_A",
      "FAKE_CATEGORY_B",
    ]);
  });

  it("lists only the categories of the given tests", () => {
    const tests = [generateCategorizedTest("FAKE_TEST_A", "ENDURANCE")];

    expect(categoriesOfTests(tests)).toEqual(["ENDURANCE"]);
  });

  it("adds no category for a test without one", () => {
    const tests = [
      generateSportTest("FAKE_TEST_A"),
      generateCategorizedTest("FAKE_TEST_B", "ENDURANCE"),
    ];

    expect(categoriesOfTests(tests)).toEqual(["ENDURANCE"]);
  });
});

describe("filterTestsByCategory", () => {
  const tests = [
    generateCategorizedTest("FAKE_TEST_A", "SPEED"),
    generateCategorizedTest("FAKE_TEST_B", "ENDURANCE"),
    generateCategorizedTest("FAKE_TEST_C", "SPEED"),
    generateSportTest("FAKE_TEST_D"),
  ];

  it("returns every test for null, including the test without a category", () => {
    expect(codesOf(filterTestsByCategory(tests, null))).toEqual([
      "FAKE_TEST_A",
      "FAKE_TEST_B",
      "FAKE_TEST_C",
      "FAKE_TEST_D",
    ]);
  });

  it("returns the tests of the category in their order", () => {
    expect(codesOf(filterTestsByCategory(tests, "SPEED"))).toEqual([
      "FAKE_TEST_A",
      "FAKE_TEST_C",
    ]);
  });

  it("returns an empty list when no test has the category", () => {
    expect(filterTestsByCategory(tests, "FAKE_CATEGORY")).toEqual([]);
  });
});

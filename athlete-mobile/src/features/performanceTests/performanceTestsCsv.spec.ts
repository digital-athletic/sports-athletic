import { type Sport } from "@/features/training/models/UserWorkoutData";
import { generatePerformanceTestValue } from "@test/factories/performanceTestValue";
import { generateSportTest } from "@test/factories/sportTest";
import {
  buildPerformanceTestsFileName,
  toPerformanceTestRows,
} from "./performanceTestsCsv";

const SPRINT = {
  ...generateSportTest("SPRINT_5M", [], {
    en: { name: "5 m sprint" },
    de: { name: "5-m-Sprint", unit: "Sek." },
  }),
};

const sportLabel = (sport: Sport): string => `label-${sport}`;

describe("toPerformanceTestRows", () => {
  it("gives one row with date, sport, test name, value and unit per value", () => {
    const rows = toPerformanceTestRows({
      values: [generatePerformanceTestValue()],
      tests: [SPRINT],
      language: "en",
      sportLabel,
    });

    expect(rows).toEqual([
      ["2026-03-01", "label-SPORT_HANDBALL", "5 m sprint", 8.1, "s"],
    ]);
  });

  it("orders the rows oldest first", () => {
    const rows = toPerformanceTestRows({
      values: [
        generatePerformanceTestValue({ id: "b", date: "2026-03-05" }),
        generatePerformanceTestValue({ id: "a", date: "2026-02-01" }),
      ],
      tests: [SPRINT],
      language: "en",
      sportLabel,
    });

    expect(rows.map((row) => row[0])).toEqual(["2026-02-01", "2026-03-05"]);
  });

  it("keeps the entry order of values on the same date", () => {
    const rows = toPerformanceTestRows({
      values: [
        generatePerformanceTestValue({ id: "first", value: 8.4 }),
        generatePerformanceTestValue({ id: "second", value: 8.2 }),
      ],
      tests: [SPRINT],
      language: "en",
      sportLabel,
    });

    expect(rows.map((row) => row[3])).toEqual([8.4, 8.2]);
  });

  it("uses the test name and unit of the language", () => {
    const rows = toPerformanceTestRows({
      values: [generatePerformanceTestValue()],
      tests: [SPRINT],
      language: "de-DE",
      sportLabel,
    });

    expect(rows[0].slice(2)).toEqual(["5-m-Sprint", 8.1, "Sek."]);
  });

  it("names a test missing from the tests by its code without a unit", () => {
    const rows = toPerformanceTestRows({
      values: [generatePerformanceTestValue({ testCode: "FAKE_TEST" })],
      tests: [SPRINT],
      language: "en",
      sportLabel,
    });

    expect(rows[0].slice(2)).toEqual(["FAKE_TEST", 8.1, null]);
  });

  it("lists the values of every sport", () => {
    const rows = toPerformanceTestRows({
      values: [
        generatePerformanceTestValue({ sport: "SPORT_HANDBALL" }),
        generatePerformanceTestValue({ sport: "SPORT_FOOTBALL" }),
      ],
      tests: [SPRINT],
      language: "en",
      sportLabel,
    });

    expect(rows.map((row) => row[1])).toEqual([
      "label-SPORT_HANDBALL",
      "label-SPORT_FOOTBALL",
    ]);
  });

  it("gives no rows without values", () => {
    expect(
      toPerformanceTestRows({
        values: [],
        tests: [SPRINT],
        language: "en",
        sportLabel,
      }),
    ).toEqual([]);
  });
});

describe("buildPerformanceTestsFileName", () => {
  it("names the file after the local date", () => {
    expect(buildPerformanceTestsFileName(new Date(2026, 10, 8, 23, 30))).toBe(
      "performance-tests_2026-11-08.csv",
    );
  });
});

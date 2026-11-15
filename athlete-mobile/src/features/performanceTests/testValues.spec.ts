import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type AthleteProfile } from "./referenceRange";
import {
  BIRTHDAY_AT_14,
  generatePerformanceTestValue,
  generateReferenceValue,
  generateSportTest,
} from "./testFixtures";
import {
  formatValueWithUnit,
  isAllowedValueDate,
  latestResult,
  parseTestValue,
  rangeLinePoints,
  sortNewestFirst,
  valuesOfTest,
} from "./testValues";

/**
 * A female handball wing player born on 2012-11-01, e.g. she is 12 on 2025-10-01
 * and 14 on 2026-11-10.
 */
const generateAthlete = (): AthleteProfile => ({
  sport: "SPORT_HANDBALL",
  gender: "FEMALE",
  position: "WING",
  birthday: BIRTHDAY_AT_14,
});

/**
 * A test with a range for ages 11 to 12 (11.5 to 9.5 s) and another for ages 13 to 14 (9.87 to 6.54 s),
 * e.g. generateSportTestWithTwoAgeRanges().referenceValues has two entries.
 */
const generateSportTestWithTwoAgeRanges = () =>
  generateSportTest("FAKE_TEST", [
    generateReferenceValue({
      trainingStage: "BASISTRAINING",
      minAge: 11,
      maxAge: 12,
      rangeStart: 11.5,
      rangeEnd: 9.5,
    }),
    generateReferenceValue(),
  ]);

describe("parseTestValue: input", () => {
  it.each([
    ["a decimal comma", "8,1", 8.1],
    ["a decimal point", "8.1", 8.1],
    ["a whole number", "8", 8],
    ["zero", "0", 0],
  ])("reads %s", (_label, input, expected) => {
    expect(parseTestValue(input)).toBe(expected);
  });

  it.each([
    ["an empty input", ""],
    ["a blank input", "   "],
    ["text", "abc"],
    ["a negative number", "-1"],
    ["a digit string that is too long to be a finite number", "9".repeat(400)],
  ])("returns null for %s", (_label, input) => {
    expect(parseTestValue(input)).toBeNull();
  });
});

describe("isAllowedValueDate: not after today", () => {
  it.each([
    ["allows a day before today", "2026-03-04", true],
    ["allows today", "2026-03-05", true],
    ["rejects a day after today", "2026-03-06", false],
  ])("%s", (_label, date, expected) => {
    expect(isAllowedValueDate(date, "2026-03-05")).toBe(expected);
  });
});

describe("sortNewestFirst: order", () => {
  it("puts the newest date first", () => {
    const older = generatePerformanceTestValue({
      id: "id-older",
      date: "2026-02-01",
    });
    const newer = generatePerformanceTestValue({
      id: "id-newer",
      date: "2026-03-01",
    });

    expect(sortNewestFirst([older, newer])).toEqual([newer, older]);
  });

  it("keeps the later entry first when two dates are equal", () => {
    const entryFirst = generatePerformanceTestValue({ id: "id-first" });
    const entryLater = generatePerformanceTestValue({ id: "id-later" });

    expect(sortNewestFirst([entryFirst, entryLater])).toEqual([
      entryLater,
      entryFirst,
    ]);
  });

  it("does not change the given array", () => {
    const older = generatePerformanceTestValue({
      id: "id-older",
      date: "2026-02-01",
    });
    const newer = generatePerformanceTestValue({
      id: "id-newer",
      date: "2026-03-01",
    });
    const values = [older, newer];

    sortNewestFirst(values);

    expect(values).toEqual([older, newer]);
  });
});

describe("valuesOfTest: values of one test", () => {
  it("returns the values of the sport and test code in stored order", () => {
    const first = generatePerformanceTestValue({ id: "id-first" });
    const second = generatePerformanceTestValue({ id: "id-second" });

    expect(
      valuesOfTest([first, second], "SPORT_HANDBALL", "SPRINT_5M"),
    ).toEqual([first, second]);
  });

  it("leaves out the value of another test of the same sport", () => {
    const sprint = generatePerformanceTestValue({ id: "id-sprint" });
    const other = generatePerformanceTestValue({
      id: "id-other",
      testCode: "FAKE_TEST_B",
    });

    expect(
      valuesOfTest([sprint, other], "SPORT_HANDBALL", "SPRINT_5M"),
    ).toEqual([sprint]);
  });

  it("leaves out the value of the same test code in another sport", () => {
    const handball = generatePerformanceTestValue({ id: "id-handball" });
    const football = generatePerformanceTestValue({
      id: "id-football",
      sport: "SPORT_FOOTBALL",
    });

    expect(
      valuesOfTest([handball, football], "SPORT_HANDBALL", "SPRINT_5M"),
    ).toEqual([handball]);
  });
});

describe("latestResult: newest value with its status", () => {
  it("returns null for no values", () => {
    const values: PerformanceTestValue[] = [];

    expect(
      latestResult(
        generateSportTestWithTwoAgeRanges(),
        generateAthlete(),
        values,
      ),
    ).toBeNull();
  });

  it("rates the newest value with the range of its own age", () => {
    const older = generatePerformanceTestValue({
      id: "id-older",
      date: "2025-10-01",
      value: 10.2,
    });
    const newer = generatePerformanceTestValue({
      id: "id-newer",
      date: "2026-11-10",
      value: 10.2,
    });

    const result = latestResult(
      generateSportTestWithTwoAgeRanges(),
      generateAthlete(),
      [older, newer],
    );

    expect(result).toEqual({ value: newer, status: "BELOW_RANGE" });
  });

  it("returns a null status when the date of the newest value has no range", () => {
    const value = generatePerformanceTestValue({ date: "2022-11-01" });

    const result = latestResult(
      generateSportTestWithTwoAgeRanges(),
      generateAthlete(),
      [value],
    );

    expect(result).toEqual({ value, status: null });
  });
});

describe("rangeLinePoints: chart points", () => {
  it("orders the points oldest first, each with the range of its own age range", () => {
    const inBasistraining = generatePerformanceTestValue({
      id: "id-basis",
      date: "2025-10-01",
      value: 10.2,
    });
    const inGrundlagentraining = generatePerformanceTestValue({
      id: "id-grund",
      date: "2026-11-10",
      value: 10.2,
    });

    const points = rangeLinePoints(
      generateSportTestWithTwoAgeRanges(),
      generateAthlete(),
      [inGrundlagentraining, inBasistraining],
    );

    expect(points).toEqual([
      {
        date: "2025-10-01",
        value: 10.2,
        range: expect.objectContaining({ rangeStart: 11.5, rangeEnd: 9.5 }),
      },
      {
        date: "2026-11-10",
        value: 10.2,
        range: expect.objectContaining({ rangeStart: 9.87, rangeEnd: 6.54 }),
      },
    ]);
  });

  it("gives a value on a date without a range a null range", () => {
    const value = generatePerformanceTestValue({ date: "2022-11-01" });

    const points = rangeLinePoints(
      generateSportTestWithTwoAgeRanges(),
      generateAthlete(),
      [value],
    );

    expect(points).toEqual([{ date: "2022-11-01", value: 8.1, range: null }]);
  });
});

describe("formatValueWithUnit: language", () => {
  it("uses a decimal comma in German", () => {
    expect(formatValueWithUnit(8.1, "s", "de")).toBe("8,1 s");
  });

  it("uses a decimal point in English", () => {
    expect(formatValueWithUnit(8.1, "s", "en")).toBe("8.1 s");
  });
});

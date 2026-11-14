import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { generatePerformanceTestValue } from "./testFixtures";
import {
  isAllowedValueDate,
  latestValue,
  parseTestValue,
  sortNewestFirst,
  testValuesKey,
} from "./testValues";

describe("parseTestValue: input", () => {
  it("reads a decimal comma", () => {
    expect(parseTestValue("8,1")).toBe(8.1);
  });

  it("reads a decimal point", () => {
    expect(parseTestValue("8.1")).toBe(8.1);
  });

  it("reads a whole number", () => {
    expect(parseTestValue("8")).toBe(8);
  });

  it("reads zero", () => {
    expect(parseTestValue("0")).toBe(0);
  });

  it("returns null for an empty input", () => {
    expect(parseTestValue("")).toBeNull();
  });

  it("returns null for a blank input", () => {
    expect(parseTestValue("   ")).toBeNull();
  });

  it("returns null for text", () => {
    expect(parseTestValue("abc")).toBeNull();
  });

  it("returns null for a negative number", () => {
    expect(parseTestValue("-1")).toBeNull();
  });
});

describe("isAllowedValueDate: not after today", () => {
  it("allows a day before today", () => {
    expect(isAllowedValueDate("2026-03-04", "2026-03-05")).toBe(true);
  });

  it("allows today", () => {
    expect(isAllowedValueDate("2026-03-05", "2026-03-05")).toBe(true);
  });

  it("rejects a day after today", () => {
    expect(isAllowedValueDate("2026-03-06", "2026-03-05")).toBe(false);
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

describe("latestValue: newest entry", () => {
  it("returns the value with the newest date", () => {
    const older = generatePerformanceTestValue({
      id: "id-older",
      date: "2026-02-01",
      value: 10.2,
    });
    const newer = generatePerformanceTestValue({
      id: "id-newer",
      date: "2026-03-01",
      value: 8.1,
    });

    expect(latestValue([newer, older])).toEqual(newer);
  });

  it("returns the later entry when two dates are equal", () => {
    const entryFirst = generatePerformanceTestValue({ id: "id-first" });
    const entryLater = generatePerformanceTestValue({ id: "id-later" });

    expect(latestValue([entryFirst, entryLater])).toEqual(entryLater);
  });

  it("returns null for no values", () => {
    const values: PerformanceTestValue[] = [];

    expect(latestValue(values)).toBeNull();
  });
});

describe("testValuesKey: storage key", () => {
  it("joins sport and test code with a slash", () => {
    expect(testValuesKey("SPORT_HANDBALL", "SPRINT_5M")).toBe(
      "SPORT_HANDBALL/SPRINT_5M",
    );
  });
});

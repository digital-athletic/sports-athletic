import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { type MaxValuesType } from "@/schemas/user.schema";
import {
  strengthTestDirection,
  strengthTestPerformanceValues,
} from "./strengthTestValues";
import { generateSportTest } from "@test/factories/sportTest";

/**
 * A strength test result of 2026-11-10 with distinct weights, e.g.
 * squat 84 kg, deadlift 105 kg, bench press 56 kg, rowing 49 kg, shoulder press 35 kg.
 */
const generateStrengthTestResult = (): MaxValuesType => ({
  ...DEFAULT_MAX_VALUES,
  testAt: new Date(2026, 10, 10, 12).getTime(),
  kneeDominant: { barbell: 84 },
  hipHinge: { barbell: 105 },
  horizontalPush: { barbell: 56 },
  horizontalPull: { barbell: 49 },
  verticalPush: { barbell: 35 },
});

describe("strengthTestDirection", () => {
  it.each([
    ["SQUAT", "kneeDominant"],
    ["DEADLIFT", "hipHinge"],
    ["BENCH_PRESS", "horizontalPush"],
    ["ROW", "horizontalPull"],
    ["SHOULDER_PRESS", "verticalPush"],
  ])("reads the movement direction of %s as %s", (code, direction) => {
    expect(strengthTestDirection(generateSportTest(code))).toBe(direction);
  });

  it("is null for a test without a strength test exercise", () => {
    expect(strengthTestDirection(generateSportTest("SPRINT_5M"))).toBeNull();
  });
});

describe("strengthTestPerformanceValues", () => {
  it("adds one value per mapped test, relative to the body weight, on the test date", () => {
    const tests = [
      generateSportTest("SQUAT"),
      generateSportTest("BENCH_PRESS"),
      generateSportTest("SPRINT_5M"),
    ];

    const values = strengthTestPerformanceValues({
      result: generateStrengthTestResult(),
      tests,
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values).toEqual([
      {
        sport: "SPORT_HANDBALL",
        testCode: "SQUAT",
        date: "2026-11-10",
        value: 1.2,
      },
      {
        sport: "SPORT_HANDBALL",
        testCode: "BENCH_PRESS",
        date: "2026-11-10",
        value: 0.8,
      },
    ]);
  });

  it("rounds the value to two decimals", () => {
    const result = {
      ...generateStrengthTestResult(),
      kneeDominant: { barbell: 85 },
    };

    const values = strengthTestPerformanceValues({
      result,
      tests: [generateSportTest("SQUAT")],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values.map(({ value }) => value)).toEqual([1.21]);
  });

  it("adds no value without a body weight", () => {
    const values = strengthTestPerformanceValues({
      result: generateStrengthTestResult(),
      tests: [generateSportTest("SQUAT")],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: undefined,
    });

    expect(values).toEqual([]);
  });

  it("adds no value without a mapped test", () => {
    const values = strengthTestPerformanceValues({
      result: generateStrengthTestResult(),
      tests: [generateSportTest("SPRINT_5M")],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values).toEqual([]);
  });

  it.each([
    ["a missing", undefined],
    ["a zero", 0],
    ["a non finite", Number.NaN],
  ])("adds no value for %s maximum", (_label, barbell) => {
    const result = {
      ...generateStrengthTestResult(),
      kneeDominant: { barbell },
    };

    const values = strengthTestPerformanceValues({
      result,
      tests: [generateSportTest("SQUAT")],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values).toEqual([]);
  });
});

describe("strengthTestPerformanceValues: damaged results", () => {
  it("adds no value for a result without a valid test date", () => {
    const values = strengthTestPerformanceValues({
      result: { ...generateStrengthTestResult(), testAt: Number.NaN },
      tests: [generateSportTest("SQUAT")],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values).toEqual([]);
  });

  it("adds no value for a direction missing from a stored result", () => {
    const { kneeDominant: _missing, ...withoutSquat } =
      generateStrengthTestResult();
    // A result stored by an older app version can lack a direction.
    const result = withoutSquat as unknown as MaxValuesType;

    const values = strengthTestPerformanceValues({
      result,
      tests: [generateSportTest("SQUAT"), generateSportTest("DEADLIFT")],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values.map(({ testCode }) => testCode)).toEqual(["DEADLIFT"]);
  });

  it("adds no value without performance tests", () => {
    const values = strengthTestPerformanceValues({
      result: generateStrengthTestResult(),
      tests: [],
      sport: "SPORT_HANDBALL",
      bodyWeightKg: 70,
    });

    expect(values).toEqual([]);
  });
});

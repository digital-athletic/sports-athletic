import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import {
  buildExportFileName,
  toStrengthTestRows,
  toWorkoutRows,
} from "./statisticsCsv";

const at = (day: number, hour = 8, minute = 5, second = 9): number =>
  new Date(2026, 0, day, hour, minute, second).getTime();

describe("statisticsCsv: toWorkoutRows", () => {
  it("maps one row per workout with a local ISO timestamp", () => {
    const workouts: CompleteWorkoutType[] = [
      {
        id: "w1",
        timestamp: at(3),
        exercises: [],
        duration: 1800,
        exerciseCount: 6,
        xpEarned: 120,
        movedWeight: 2500.5,
      },
    ];

    expect(toWorkoutRows(workouts)).toEqual([
      ["2026-01-03T08:05:09", 30, 6, 120, 2500.5],
    ]);
  });

  it("rounds the moved weight to two decimals", () => {
    const rows = toWorkoutRows([
      {
        id: "w1",
        timestamp: at(3),
        exercises: [],
        duration: 60,
        movedWeight: 12.300000000000001,
      },
    ]);

    expect(rows[0][4]).toBe(12.3);
  });

  it("rounds the duration to minutes with one decimal", () => {
    const rows = toWorkoutRows([
      { id: "w1", timestamp: at(3), exercises: [], duration: 100 },
    ]);

    expect(rows[0][1]).toBe(1.7);
  });

  it("falls back to 0 for missing optional numbers", () => {
    const rows = toWorkoutRows([
      { id: "w1", timestamp: at(3), exercises: [], duration: 60 },
    ]);

    expect(rows[0].slice(2)).toEqual([0, 0, 0]);
  });

  it("sorts oldest first", () => {
    const rows = toWorkoutRows([
      { id: "new", timestamp: at(9), exercises: [], duration: 60 },
      { id: "old", timestamp: at(2), exercises: [], duration: 60 },
    ]);

    expect(rows.map((row) => row[0])).toEqual([
      "2026-01-02T08:05:09",
      "2026-01-09T08:05:09",
    ]);
  });
});

describe("statisticsCsv: toStrengthTestRows", () => {
  const test = (
    testAt: number,
    barbell: Partial<
      Record<
        | "kneeDominant"
        | "hipHinge"
        | "horizontalPush"
        | "horizontalPull"
        | "verticalPush",
        number
      >
    >,
  ): MaxValuesType => ({
    ...DEFAULT_MAX_VALUES,
    testAt,
    kneeDominant: { barbell: barbell.kneeDominant },
    hipHinge: { barbell: barbell.hipHinge },
    horizontalPush: { barbell: barbell.horizontalPush },
    horizontalPull: { barbell: barbell.horizontalPull },
    verticalPush: { barbell: barbell.verticalPush },
  });

  it("maps squat, deadlift, bench press, rowing, shoulder press", () => {
    const rows = toStrengthTestRows([
      test(at(4), {
        kneeDominant: 100,
        hipHinge: 120,
        horizontalPush: 80,
        horizontalPull: 70,
        verticalPush: 50,
      }),
    ]);

    expect(rows).toEqual([["2026-01-04T08:05:09", 100, 120, 80, 70, 50]]);
  });

  it("rounds barbell values to two decimals", () => {
    const rows = toStrengthTestRows([
      test(at(4), { kneeDominant: 12.300000000000001 }),
    ]);

    expect(rows[0][1]).toBe(12.3);
  });

  it("gives null for a missing barbell value, not 0", () => {
    const rows = toStrengthTestRows([test(at(4), { kneeDominant: 100 })]);

    expect(rows[0]).toEqual([
      "2026-01-04T08:05:09",
      100,
      null,
      null,
      null,
      null,
    ]);
  });

  it("sorts oldest first", () => {
    const rows = toStrengthTestRows([test(at(8), {}), test(at(1), {})]);

    expect(rows.map((row) => row[0])).toEqual([
      "2026-01-01T08:05:09",
      "2026-01-08T08:05:09",
    ]);
  });
});

describe("statisticsCsv: buildExportFileName", () => {
  it("builds the workouts file name", () => {
    expect(buildExportFileName("workouts", "total", new Date(2026, 5, 7))).toBe(
      "workouts_total_2026-06-07.csv",
    );
  });

  it("builds the strength test file name", () => {
    expect(
      buildExportFileName("strength-tests", "week", new Date(2026, 11, 31)),
    ).toBe("strength-tests_week_2026-12-31.csv");
  });
});

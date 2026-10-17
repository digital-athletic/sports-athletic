import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import {
  filterStrengthTestsByRange,
  filterWorkoutsByRange,
  getRangeStartDate,
} from "./rangeFilter";

const DAY = 1000 * 60 * 60 * 24;
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

const workout = (id: string, timestamp: number): CompleteWorkoutType => ({
  id,
  timestamp,
  exercises: [],
  duration: 600,
});

const strengthTest = (testAt: number): MaxValuesType => ({
  ...DEFAULT_MAX_VALUES,
  testAt,
});

describe("rangeFilter: getRangeStartDate", () => {
  it.each([
    ["week", NOW - 7 * DAY],
    ["month", NOW - 30 * DAY],
    ["year", NOW - 365 * DAY],
    ["total", 0],
  ] as const)("returns the start for %s without a plan", (scale, expected) => {
    expect(getRangeStartDate(scale, null, NOW)).toBe(expected);
  });
});

describe("rangeFilter: filterWorkoutsByRange", () => {
  it("keeps only workouts after the start date", () => {
    const workouts = [
      workout("old", NOW - 8 * DAY),
      workout("recent", NOW - 2 * DAY),
    ];

    const result = filterWorkoutsByRange(workouts, "week", null, NOW);

    expect(result.map((w) => w.id)).toEqual(["recent"]);
  });

  it("excludes a workout exactly at the start date", () => {
    const result = filterWorkoutsByRange(
      [workout("edge", NOW - 7 * DAY)],
      "week",
      null,
      NOW,
    );

    expect(result).toEqual([]);
  });

  it("keeps every workout for total", () => {
    const workouts = [workout("a", 1), workout("b", NOW)];

    expect(filterWorkoutsByRange(workouts, "total", null, NOW)).toHaveLength(2);
  });
});

describe("rangeFilter: total keeps timestamp 0", () => {
  it("keeps a workout at timestamp 0", () => {
    expect(
      filterWorkoutsByRange([workout("legacy", 0)], "total", null, NOW),
    ).toHaveLength(1);
  });

  it("keeps a strength test at testAt 0", () => {
    expect(
      filterStrengthTestsByRange([strengthTest(0)], "total", NOW),
    ).toHaveLength(1);
  });

  it("still drops timestamp 0 for a bounded range", () => {
    expect(filterStrengthTestsByRange([strengthTest(0)], "year", NOW)).toEqual(
      [],
    );
  });
});

describe("rangeFilter: filterStrengthTestsByRange", () => {
  it("keeps only strength tests after the start date", () => {
    const history = [strengthTest(NOW - 40 * DAY), strengthTest(NOW - DAY)];

    const result = filterStrengthTestsByRange(history, "month", NOW);

    expect(result.map((test) => test.testAt)).toEqual([NOW - DAY]);
  });

  it("excludes a strength test exactly at the start date", () => {
    expect(
      filterStrengthTestsByRange([strengthTest(NOW - 30 * DAY)], "month", NOW),
    ).toEqual([]);
  });
});

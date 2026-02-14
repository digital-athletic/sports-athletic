import { WorkoutConstants } from "@/constants/workoutConstants";
import type { UserType } from "@/schemas/user.schema";
import { DEFAULT_MAX_VALUES } from "../models/MaxValues";
import { applyMaxValueToDirections, getUserLevel } from "./workoutUtils";

const MOCK_TIMESTAMP = 1736294400000; // 2026-01-08T00:00:00.000Z

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(MOCK_TIMESTAMP);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getUserLevel", () => {
  it("returns BEGINNER when user is null", () => {
    const result = getUserLevel(null as unknown as UserType);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER when user is undefined", () => {
    const result = getUserLevel(undefined as unknown as UserType);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER when workoutData is undefined", () => {
    const user: UserType = {
      userId: "test-user-1",
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER when workoutData.tags is undefined", () => {
    const user: UserType = {
      userId: "test-user-2",
      workoutData: {},
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER when workoutData.tags is an empty object", () => {
    const user: UserType = {
      userId: "test-user-3",
      workoutData: {
        tags: {},
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER when tags object contains no LEVEL key", () => {
    const user: UserType = {
      userId: "test-user-4",
      workoutData: {
        tags: { POSITION: ["FIELD"], PAIN: ["KNEE"] },
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER level from tags", () => {
    const user: UserType = {
      userId: "test-user-5",
      workoutData: {
        tags: { POSITION: ["FIELD"], LEVEL: ["BEGINNER"], PAIN: ["SHOULDER"] },
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns ADVANCED level from tags", () => {
    const user: UserType = {
      userId: "test-user-6",
      workoutData: {
        tags: { POSITION: ["GOAL"], LEVEL: ["ADVANCED"] },
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.ADVANCED);
  });

  it("returns PROFESSIONAL level from tags", () => {
    const user: UserType = {
      userId: "test-user-7",
      workoutData: {
        tags: { LEVEL: ["PROFESSIONAL"], POSITION: ["FIELD"] },
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.PROFESSIONAL);
  });

  it("returns the first LEVEL value when multiple LEVEL values exist", () => {
    const user: UserType = {
      userId: "test-user-8",
      workoutData: {
        tags: { LEVEL: ["ADVANCED", "BEGINNER"], POSITION: ["FIELD"] },
      },
    };
    const result = getUserLevel(user);
    // Should return the first LEVEL value found
    expect(result).toBe(WorkoutConstants.LEVELS.ADVANCED);
  });
});

describe("applyMaxValueToDirections", () => {
  /**
   * This represents the NEW 1RM result calculated after a user completes a force test.
   *
   * Example: User does Bench Press test with 80kg for 8 reps
   * → Epley formula: 80 * (1 + 8/30) ≈ 101kg 1RM
   * → calculateAdjustedMaxValues(101) produces these values for different equipment types
   */
  const newCalculatedResult = {
    barbell: 100, // 1RM for barbell exercises
    dumbbells: 45, // ~45% of barbell for dumbbell exercises
    oneSidedUpper: 45, // single-arm upper body
    oneSidedBarbell: 45, // single-leg barbell
    oneSidedLower: 22.5, // single-leg dumbbell
    oneSidedLowerSupported: 30, // single-leg with support
  };

  it("should apply max value to a single direction", () => {
    // User completes Bench Press test (exercise ID 7)
    // TEST_EXERCISES_DIRECTIONS[7] = ["HORIZONTAL_PUSH"]
    // → Result should be saved to horizontalPush only
    const result = applyMaxValueToDirections(
      DEFAULT_MAX_VALUES, // User's current maxValues (empty/default before first test)
      ["HORIZONTAL_PUSH"], // Direction(s) this test exercise measures
      newCalculatedResult, // Newly calculated 1RM from the test
    );

    expect(result.horizontalPush).toEqual(newCalculatedResult);
    expect(result.testAt).toBe(MOCK_TIMESTAMP);
    // Other directions should remain unchanged (still default/empty)
    expect(result.verticalPush).toEqual(DEFAULT_MAX_VALUES.verticalPush);
    expect(result.horizontalPull).toEqual(DEFAULT_MAX_VALUES.horizontalPull);
  });

  it("should apply max value to multiple directions", () => {
    // User completes Shoulder Press test (exercise ID 54)
    // TEST_EXERCISES_DIRECTIONS[54] = ["VERTICAL_PUSH", "VERTICAL_PULL"]
    // → Same result applies to both vertical directions
    const result = applyMaxValueToDirections(
      DEFAULT_MAX_VALUES,
      ["VERTICAL_PUSH", "VERTICAL_PULL"],
      newCalculatedResult,
    );

    // Both directions get the same new result
    expect(result.verticalPush).toEqual(newCalculatedResult);
    expect(result.verticalPull).toEqual(newCalculatedResult);
    expect(result.testAt).toBe(MOCK_TIMESTAMP);
    // Unrelated directions remain unchanged
    expect(result.horizontalPush).toEqual(DEFAULT_MAX_VALUES.horizontalPush);
  });
});

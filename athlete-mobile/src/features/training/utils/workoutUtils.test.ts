import { WorkoutConstants } from "@/constants/workoutConstants";
import type { UserType } from "@/features/profile/models/User";
import { DEFAULT_MAX_VALUES } from "../models/MaxValues";
import { applyMaxValueToDirections, getUserLevel } from "./workoutUtils";

// Mock the date utility to return a consistent date for testing
jest.mock("@/utils/date", () => ({
  dateToDDMMYYYY: () => "08-01-2026",
}));

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

  it("returns BEGINNER when workoutData.tags is an empty array", () => {
    const user: UserType = {
      userId: "test-user-3",
      workoutData: {
        tags: [],
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER when tags array contains no LEVEL tags", () => {
    const user: UserType = {
      userId: "test-user-4",
      workoutData: {
        tags: ["POSITION_FIELD", "PAIN_KNEE"],
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns BEGINNER level from tags", () => {
    const user: UserType = {
      userId: "test-user-5",
      workoutData: {
        tags: ["POSITION_FIELD", "LEVEL_BEGINNER", "PAIN_SHOULDER"],
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.BEGINNER);
  });

  it("returns ADVANCED level from tags", () => {
    const user: UserType = {
      userId: "test-user-6",
      workoutData: {
        tags: ["POSITION_GOAL", "LEVEL_ADVANCED"],
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.ADVANCED);
  });

  it("returns PROFESSIONAL level from tags", () => {
    const user: UserType = {
      userId: "test-user-7",
      workoutData: {
        tags: ["LEVEL_PROFESSIONAL", "POSITION_FIELD"],
      },
    };
    const result = getUserLevel(user);
    expect(result).toBe(WorkoutConstants.LEVELS.PROFESSIONAL);
  });

  it("returns the first LEVEL tag when multiple LEVEL tags exist", () => {
    const user: UserType = {
      userId: "test-user-8",
      workoutData: {
        tags: ["LEVEL_ADVANCED", "LEVEL_BEGINNER", "POSITION_FIELD"],
      },
    };
    const result = getUserLevel(user);
    // Should return the first LEVEL tag found
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
    expect(result.testDate).toBe("08-01-2026");
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
    expect(result.testDate).toBe("08-01-2026");
    // Unrelated directions remain unchanged
    expect(result.horizontalPush).toEqual(DEFAULT_MAX_VALUES.horizontalPush);
  });
});

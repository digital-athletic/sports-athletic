import { DEFAULT_MAX_VALUES } from "../models/MaxValues";
import { applyMaxValueToDirections } from "./workoutUtils";

// Mock the date utility to return a consistent date for testing
jest.mock("@/utils/date", () => ({
  dateToDDMMYYYY: () => "08-01-2026",
}));

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

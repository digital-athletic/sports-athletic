import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import { getLastMaxFRep } from "./maxFRepetitionsUtils";

/**
 * Tests the safe access pattern for maxFRepetitions used in training-active.tsx.
 *
 * Bug: When exercise.maxFRepetitions is undefined (e.g. MAX exercises
 * where repetitionMAX was not passed through the schema), accessing
 * maxFRepetitions[length-1].level crashes with a TypeError.
 *
 * Fix: getLastMaxFRep returns undefined for empty/undefined arrays.
 * When maxFRepetitions is undefined/empty, all conditions using
 * lastMaxFRep?.level evaluate to false and fall through to default paths.
 */

// Extract the conditional logic from training-active.tsx (lines 571-644)
type AdjustmentResult = {
  levelUp: boolean;
  levelDown: boolean;
  increaseWeight: boolean;
  decreaseWeight: boolean;
  feedbackOverride: string | null;
};

const computeMaxFAdjustment = (
  lastMaxFRep: MaxForceRepetitionsDataType | undefined,
  weightPercentage: number | null,
  maximumWeightPercentage: number | null,
  minimumWeightPercentage: number | null,
  adjustment: string | null,
): AdjustmentResult => {
  let increaseWeight = false;
  let decreaseWeight = false;
  let levelUp = false;
  let levelDown = false;
  let feedbackOverride: string | null = null;

  if (
    (typeof weightPercentage === "number" &&
      typeof maximumWeightPercentage === "number" &&
      weightPercentage >= maximumWeightPercentage &&
      lastMaxFRep?.level === "HARD" &&
      adjustment !== "TOO_HARD") ||
    (lastMaxFRep?.level === "MEDIUM" && adjustment === "TOO_EASY")
  ) {
    levelUp = true;
  } else if (
    typeof weightPercentage === "number" &&
    typeof minimumWeightPercentage === "number" &&
    weightPercentage <= minimumWeightPercentage &&
    adjustment === "TOO_HARD"
  ) {
    levelDown = true;
  } else if (
    typeof weightPercentage === "number" &&
    typeof maximumWeightPercentage === "number" &&
    weightPercentage >= maximumWeightPercentage &&
    lastMaxFRep?.level === "MEDIUM" &&
    adjustment === "TOO_EASY"
  ) {
    feedbackOverride = "SUCCEEDED";
  } else {
    if (
      (lastMaxFRep?.level === "HARD" && adjustment !== "TOO_HARD") ||
      (lastMaxFRep?.level === "MEDIUM" && adjustment === "TOO_EASY")
    ) {
      increaseWeight = true;
    } else if (adjustment === "TOO_HARD") {
      decreaseWeight = true;
    }
  }

  return {
    levelUp,
    levelDown,
    increaseWeight,
    decreaseWeight,
    feedbackOverride,
  };
};

describe("maxFRepetitions fallback behavior", () => {
  describe("getLastMaxFRep", () => {
    it("returns undefined when maxFRepetitions is undefined", () => {
      expect(getLastMaxFRep(undefined)).toBeUndefined();
    });

    it("returns undefined when maxFRepetitions is empty array", () => {
      expect(getLastMaxFRep([])).toBeUndefined();
    });

    it("returns last element when maxFRepetitions has entries", () => {
      const reps: MaxForceRepetitionsDataType[] = [
        { level: "EASY", repetitions: 8 },
        { level: "HARD", repetitions: 3 },
      ];
      expect(getLastMaxFRep(reps)).toEqual({ level: "HARD", repetitions: 3 });
    });

    it("returns single element when maxFRepetitions has one entry", () => {
      const reps: MaxForceRepetitionsDataType[] = [
        { level: "MEDIUM", repetitions: 5 },
      ];
      expect(getLastMaxFRep(reps)).toEqual({ level: "MEDIUM", repetitions: 5 });
    });
  });

  describe("computeMaxFAdjustment with undefined maxFRepetitions (crash scenario)", () => {
    const lastMaxFRep = undefined; // simulates missing maxFRepetitions

    it("does not crash with TOO_EASY adjustment", () => {
      const result = computeMaxFAdjustment(lastMaxFRep, 80, 90, 50, "TOO_EASY");
      expect(result).toEqual({
        levelUp: false,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });

    it("does not crash with TOO_HARD adjustment", () => {
      const result = computeMaxFAdjustment(lastMaxFRep, 80, 90, 50, "TOO_HARD");
      expect(result).toEqual({
        levelUp: false,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: true,
        feedbackOverride: null,
      });
    });

    it("does not crash with SUCCEEDED adjustment", () => {
      const result = computeMaxFAdjustment(
        lastMaxFRep,
        80,
        90,
        50,
        "SUCCEEDED",
      );
      expect(result).toEqual({
        levelUp: false,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });

    it("falls through to TOO_HARD level down when at minimum weight", () => {
      const result = computeMaxFAdjustment(lastMaxFRep, 50, 90, 50, "TOO_HARD");
      expect(result).toEqual({
        levelUp: false,
        levelDown: true,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });
  });

  describe("computeMaxFAdjustment with populated maxFRepetitions", () => {
    it("triggers levelUp when last rep is HARD and at max weight with non-TOO_HARD feedback", () => {
      const lastMaxFRep: MaxForceRepetitionsDataType = {
        level: "HARD",
        repetitions: 3,
      };
      const result = computeMaxFAdjustment(lastMaxFRep, 90, 90, 50, "TOO_EASY");
      expect(result).toEqual({
        levelUp: true,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });

    it("triggers levelUp when last rep is MEDIUM and adjustment is TOO_EASY", () => {
      const lastMaxFRep: MaxForceRepetitionsDataType = {
        level: "MEDIUM",
        repetitions: 5,
      };
      const result = computeMaxFAdjustment(lastMaxFRep, 70, 90, 50, "TOO_EASY");
      expect(result).toEqual({
        levelUp: true,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });

    it("triggers increaseWeight when last rep is HARD and not at max weight", () => {
      const lastMaxFRep: MaxForceRepetitionsDataType = {
        level: "HARD",
        repetitions: 3,
      };
      const result = computeMaxFAdjustment(lastMaxFRep, 70, 90, 50, "TOO_EASY");
      expect(result).toEqual({
        levelUp: false,
        levelDown: false,
        increaseWeight: true,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });

    it("overrides feedback to SUCCEEDED when MEDIUM at max weight with TOO_EASY", () => {
      const lastMaxFRep: MaxForceRepetitionsDataType = {
        level: "MEDIUM",
        repetitions: 5,
      };
      const result = computeMaxFAdjustment(lastMaxFRep, 90, 90, 50, "TOO_EASY");
      // Note: The first condition (levelUp for MEDIUM + TOO_EASY) catches this before
      // the feedbackOverride branch, so levelUp = true
      expect(result.levelUp).toBe(true);
    });
  });

  describe("edge cases for null weight values", () => {
    it("handles null weightPercentage without crash", () => {
      const lastMaxFRep: MaxForceRepetitionsDataType = {
        level: "HARD",
        repetitions: 3,
      };
      const result = computeMaxFAdjustment(
        lastMaxFRep,
        null,
        90,
        50,
        "TOO_EASY",
      );
      // With null weightPercentage, the first typeof check fails,
      // but MEDIUM+TOO_EASY doesn't match HARD level, so falls to else
      expect(result.increaseWeight).toBe(true);
    });

    it("handles null maximumWeightPercentage without crash", () => {
      const result = computeMaxFAdjustment(undefined, 80, null, 50, "TOO_EASY");
      expect(result).toEqual({
        levelUp: false,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });

    it("handles all null values without crash", () => {
      const result = computeMaxFAdjustment(undefined, null, null, null, null);
      expect(result).toEqual({
        levelUp: false,
        levelDown: false,
        increaseWeight: false,
        decreaseWeight: false,
        feedbackOverride: null,
      });
    });
  });
});

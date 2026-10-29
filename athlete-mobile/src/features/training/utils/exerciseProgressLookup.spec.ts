import {
  generateExerciseDataMap,
  generateStoredProgress,
  generateStoredExerciseData,
} from "@test/factories/storedExerciseData";
import { readOwnExerciseProgress, toUpdatedAt } from "./exerciseProgressLookup";

describe("exerciseProgressLookup: readOwnExerciseProgress", () => {
  it("returns the own record unchanged with every field", () => {
    const own = generateStoredExerciseData({
      skill: "SA",
      weight: 40,
      weightType: "weightAbsolute",
      repetition: 12,
      tooHardCount: 1,
      feedback: { difficulty: "TOO_EASY", streakCounter: 2 },
      updatedAt: 100,
    });
    const other = generateStoredExerciseData({
      skill: "SWR1",
      weight: 60,
      updatedAt: 200,
    });
    const progress = generateStoredProgress(own, other);

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(own);
  });

  it("returns null when only another skill trained the exercise", () => {
    const other = generateStoredExerciseData({
      skill: "SWR1",
      weight: 50,
      weightType: "weightAbsolute",
    });
    const progress = generateStoredProgress(other);

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(null);
  });

  it("returns null when the exercise has no record", () => {
    const progress = generateStoredProgress(
      generateStoredExerciseData({ exerciseId: "2", skill: "SA", weight: 50 }),
    );

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(null);
  });

  it("ignores the shared record per exercise, even when it names the skill", () => {
    const shared = generateStoredExerciseData({ skill: "SA", weight: 40 });
    const progress = {
      exerciseProgress: {},
      exerciseData: generateExerciseDataMap(shared),
    };

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(null);
  });
});

describe("exerciseProgressLookup: toUpdatedAt", () => {
  it("floors milliseconds to Unix seconds", () => {
    expect(toUpdatedAt(1761550000999)).toBe(1761550000);
  });
});

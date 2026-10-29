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
});

describe("exerciseProgressLookup: older record per exercise", () => {
  it("reads the older record as own when its skill matches and no per skill record exists", () => {
    const older = generateStoredExerciseData({
      skill: "SA",
      weight: 40,
      repetition: 12,
    });
    const progress = { exerciseData: generateExerciseDataMap(older) };

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(older);
  });

  it("prefers the per skill record over the older record of the same skill", () => {
    const own = generateStoredExerciseData({ skill: "SA", repetition: 15 });
    const older = generateStoredExerciseData({ skill: "SA", repetition: 9 });
    const progress = {
      ...generateStoredProgress(own),
      exerciseData: generateExerciseDataMap(older),
    };

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(own);
  });

  it("returns null for an older record of another skill", () => {
    const older = generateStoredExerciseData({
      skill: "SWR1",
      weight: 62.5,
      repetition: 8,
    });
    const progress = { exerciseData: generateExerciseDataMap(older) };

    expect(readOwnExerciseProgress(progress, "SA", "1")).toBe(null);
  });
});

describe("exerciseProgressLookup: toUpdatedAt", () => {
  it("floors milliseconds to Unix seconds", () => {
    expect(toUpdatedAt(1761550000999)).toBe(1761550000);
  });
});

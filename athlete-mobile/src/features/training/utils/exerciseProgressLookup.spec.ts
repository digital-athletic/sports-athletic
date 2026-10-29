import {
  generateExerciseProgressMap,
  generateStoredExerciseData,
} from "@test/factories/storedExerciseData";
import { generateValueExercise } from "@test/factories/valueExercise";
import {
  generateAuthoredUnitExercise,
  generateWeightIntensity,
} from "@test/factories/weightIntensity";
import {
  readExerciseProgress,
  readExpectedWeightType,
  readOwnExerciseProgress,
  toUpdatedAt,
} from "./exerciseProgressLookup";

describe("exerciseProgressLookup: readExerciseProgress own record", () => {
  it("returns the record unchanged when the skill wrote it last", () => {
    const own = generateStoredExerciseData({
      skill: "SA",
      weight: 40,
      weightType: "weightAbsolute",
      repetition: 12,
      tooHardCount: 1,
      feedback: { difficulty: "TOO_EASY", streakCounter: 2 },
      updatedAt: 100,
    });
    const progress = generateExerciseProgressMap(own);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toEqual(
      own,
    );
  });

  it("returns the own record when it holds no weight", () => {
    const own = generateStoredExerciseData({ skill: "SA", repetition: 9 });
    const progress = generateExerciseProgressMap(own);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toEqual(
      own,
    );
  });
});

describe("exerciseProgressLookup: readExerciseProgress load seed", () => {
  it("copies only weight and weightType from a record of another skill", () => {
    const source = generateStoredExerciseData({
      skill: "SWR1",
      weight: 50,
      weightType: "weightAbsolute",
      repetition: 15,
      duration: 30,
      height: 20,
      tooHardCount: 2,
      maxFRepetitions: [
        { level: "MEDIUM", repetitions: 3, weightPercentage: 80 },
      ],
      maxFLevelAdjustment: "TOO_HARD",
      nextWeightPercentage: 85,
      skipped: true,
      set: [2, 2],
      branchId: "412",
      feedback: { difficulty: "TOO_EASY", streakCounter: 2 },
      updatedAt: 100,
    });
    const progress = generateExerciseProgressMap(source);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toEqual(
      {
        exerciseId: "1",
        skill: "SA",
        weight: 50,
        weightType: "weightAbsolute",
      },
    );
  });

  it("seeds a load of 0 kg", () => {
    const source = generateStoredExerciseData({ skill: "SWR1", weight: 0 });
    const progress = generateExerciseProgressMap(source);

    expect(
      readExerciseProgress(progress, "SA", "1", "weightAbsolute")?.weight,
    ).toBe(0);
  });

  it("sets weightType weightAbsolute on the seed of a record without weightType", () => {
    const source = generateStoredExerciseData({ skill: "SWR1", weight: 30 });
    const progress = generateExerciseProgressMap(source);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toEqual(
      {
        exerciseId: "1",
        skill: "SA",
        weight: 30,
        weightType: "weightAbsolute",
      },
    );
  });
});

describe("exerciseProgressLookup: readExerciseProgress no match", () => {
  it("returns null when the record of another skill has another weight type", () => {
    const source = generateStoredExerciseData({
      skill: "SWR1",
      weight: 70,
      weightType: "weightFMax",
    });
    const progress = generateExerciseProgressMap(source);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toBe(
      null,
    );
  });

  it("returns null when the record of another skill holds no weight", () => {
    const source = generateStoredExerciseData({
      skill: "SWR1",
      repetition: 15,
    });
    const progress = generateExerciseProgressMap(source);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toBe(
      null,
    );
  });

  it("returns null when the exercise has no record", () => {
    const source = generateStoredExerciseData({
      exerciseId: "2",
      skill: "SWR1",
      weight: 50,
    });
    const progress = generateExerciseProgressMap(source);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toBe(
      null,
    );
  });
});

describe("exerciseProgressLookup: readOwnExerciseProgress", () => {
  it("returns the record when the skill wrote it last", () => {
    const own = generateStoredExerciseData({
      skill: "MAX_STRENGTH",
      weight: 80,
    });
    const progress = generateExerciseProgressMap(own);

    expect(readOwnExerciseProgress(progress, "MAX_STRENGTH", "1")).toBe(own);
  });

  it("returns null instead of seeding from another skill", () => {
    const other = generateStoredExerciseData({ skill: "MAX", weight: 80 });
    const progress = generateExerciseProgressMap(other);

    expect(readOwnExerciseProgress(progress, "MAX_STRENGTH", "1")).toBe(null);
  });
});

describe("exerciseProgressLookup: readExpectedWeightType", () => {
  it("returns weightFMax for an exercise that authors weightFMax", () => {
    const exercise = generateAuthoredUnitExercise("weightFMax");
    const intensity = generateWeightIntensity("weightAbsolute");

    expect(readExpectedWeightType(exercise, intensity)).toBe("weightFMax");
  });

  it("returns the intensity weight type when the exercise authors none", () => {
    const exercise = generateValueExercise("repetition");
    const intensity = generateWeightIntensity("weightFMax");

    expect(readExpectedWeightType(exercise, intensity)).toBe("weightFMax");
  });

  it("returns weightAbsolute for a null intensity", () => {
    const exercise = generateAuthoredUnitExercise("weightFMax");

    expect(readExpectedWeightType(exercise, null)).toBe("weightAbsolute");
  });
});

describe("exerciseProgressLookup: toUpdatedAt", () => {
  it("floors milliseconds to Unix seconds", () => {
    expect(toUpdatedAt(1761550000999)).toBe(1761550000);
  });
});

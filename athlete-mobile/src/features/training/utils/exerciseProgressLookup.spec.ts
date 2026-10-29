import {
  generateExerciseDataMap,
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
    const progress = generateExerciseProgressMap(own, other);

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toEqual(
      own,
    );
  });

  it("returns the own record when it holds no weight", () => {
    const own = generateStoredExerciseData({ skill: "SA", repetition: 9 });
    const other = generateStoredExerciseData({ skill: "SWR1", weight: 60 });
    const progress = generateExerciseProgressMap(own, other);

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

  it("seeds from the newest of two matching records", () => {
    const older = generateStoredExerciseData({
      skill: "SWR1",
      weight: 40,
      updatedAt: 100,
    });
    const newer = generateStoredExerciseData({
      skill: "SWR2",
      weight: 55,
      updatedAt: 200,
    });
    const progress = generateExerciseProgressMap(older, newer);

    expect(
      readExerciseProgress(progress, "SA", "1", "weightAbsolute")?.weight,
    ).toBe(55);
  });

  it("lets a record without updatedAt lose to a dated one", () => {
    const undated = generateStoredExerciseData({ skill: "SWR1", weight: 40 });
    const dated = generateStoredExerciseData({
      skill: "SWR2",
      weight: 55,
      updatedAt: 1,
    });
    const progress = generateExerciseProgressMap(undated, dated);

    expect(
      readExerciseProgress(progress, "SA", "1", "weightAbsolute")?.weight,
    ).toBe(55);
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

  it("skips a newer weightFMax record and seeds from an older weightAbsolute load", () => {
    const older = generateStoredExerciseData({
      skill: "SWR1",
      weight: 40,
      weightType: "weightAbsolute",
      updatedAt: 100,
    });
    const newer = generateStoredExerciseData({
      skill: "SWR2",
      weight: 70,
      weightType: "weightFMax",
      updatedAt: 200,
    });
    const progress = generateExerciseProgressMap(older, newer);

    expect(
      readExerciseProgress(progress, "SA", "1", "weightAbsolute")?.weight,
    ).toBe(40);
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

describe("exerciseProgressLookup: example skill pairs", () => {
  it.each([
    ["SWR1KG", "SWR2KG"],
    ["GKS", "GKSKG"],
    ["MAX", "MAX_STRENGTH"],
    ["PREVKNEE", "PREVSHOULDER"],
  ] as const)(
    "reads the own record of %s and %s",
    (firstSkill, secondSkill) => {
      const first = generateStoredExerciseData({
        skill: firstSkill,
        weight: 20,
        repetition: 10,
      });
      const second = generateStoredExerciseData({
        skill: secondSkill,
        weight: 25,
        repetition: 8,
      });
      const progress = generateExerciseProgressMap(first, second);

      expect(
        readExerciseProgress(progress, firstSkill, "1", "weightAbsolute"),
      ).toBe(first);
      expect(
        readExerciseProgress(progress, secondSkill, "1", "weightAbsolute"),
      ).toBe(second);
    },
  );
});

describe("exerciseProgressLookup: older record per exercise", () => {
  it("reads the older record as own when its skill matches and no per skill record exists", () => {
    const older = generateStoredExerciseData({
      skill: "SA",
      weight: 40,
      repetition: 12,
    });
    const progress = { exerciseData: generateExerciseDataMap(older) };

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toBe(
      older,
    );
  });

  it("prefers the per skill record over the older record of the same skill", () => {
    const own = generateStoredExerciseData({ skill: "SA", repetition: 15 });
    const older = generateStoredExerciseData({ skill: "SA", repetition: 9 });
    const progress = {
      ...generateExerciseProgressMap(own),
      exerciseData: generateExerciseDataMap(older),
    };

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toBe(
      own,
    );
  });

  it("seeds the load from the older record of another skill", () => {
    const older = generateStoredExerciseData({
      skill: "SWR1",
      weight: 62.5,
      repetition: 8,
    });
    const progress = { exerciseData: generateExerciseDataMap(older) };

    expect(readExerciseProgress(progress, "SA", "1", "weightAbsolute")).toEqual(
      {
        exerciseId: "1",
        skill: "SA",
        weight: 62.5,
        weightType: "weightAbsolute",
      },
    );
  });

  it("lets an undated older record lose to a dated per skill record", () => {
    const older = generateStoredExerciseData({ skill: "SWR1", weight: 70 });
    const dated = generateStoredExerciseData({
      skill: "HYP",
      weight: 60,
      updatedAt: 1,
    });
    const progress = {
      ...generateExerciseProgressMap(dated),
      exerciseData: generateExerciseDataMap(older),
    };

    expect(
      readExerciseProgress(progress, "SA", "1", "weightAbsolute")?.weight,
    ).toBe(60);
  });
});

describe("exerciseProgressLookup: readOwnExerciseProgress", () => {
  it("returns the own record", () => {
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

  it("returns null for an older record of another skill", () => {
    const older = generateStoredExerciseData({ skill: "MAX", weight: 80 });
    const progress = { exerciseData: generateExerciseDataMap(older) };

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

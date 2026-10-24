import {
  findCatalogExerciseById,
  generateAuthoredValues,
  generateValueExercise,
  type ValueExerciseOptions,
} from "../../../../test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import {
  clampValueToStartAndTarget,
  readAuthoredExerciseValue,
  readAuthoredStartValues,
  readExerciseStartValue,
  readExerciseTargetValue,
  readGenderLevelValue,
} from "./startAndTargetValues";

const advancedMan = { gender: "m", level: "advanced" } as const;

/**
 * Reads the start and target of one value of a generated exercise.
 *
 * readRange("SWR2", "duration", { withWeights: true })
 * → { start: 30, target: 50 }
 */
const readRange = (
  intensityName: string,
  mode: "repetition" | "duration",
  {
    withWeights = false,
    values = {},
    athlete = advancedMan,
  }: Pick<ValueExerciseOptions, "withWeights" | "values"> & {
    athlete?: { gender: GenderTag; level: TrainingLevelType };
  } = {},
) => {
  const intensity = loadIntensityConfig(intensityName);
  const exercise = generateValueExercise(mode, { withWeights, values });
  return {
    start: readExerciseStartValue(intensity, exercise, mode, athlete),
    target: readExerciseTargetValue(intensity, exercise, mode, athlete),
  };
};

describe("startAndTargetValues: readGenderLevelValue", () => {
  it.each([
    ["m", "advanced", 4],
    ["m", "beginner", 3],
    ["w", "advanced", 2],
    ["w", "beginner", 1],
  ])("reads gender %s and level %s as %p", (gender, level, expected) => {
    const data = {
      default: { default: 1, advanced: 2 },
      m: { default: 3, advanced: 4 },
    };

    expect(readGenderLevelValue(data, gender, level)).toBe(expected);
  });

  it.each([[""], [null]])("treats a gender value %p as not set", (value) => {
    const data = { default: { default: 25 }, m: { default: value } };

    expect(readGenderLevelValue(data, "m", "advanced")).toBe(25);
  });

  it("keeps a value of 0 and converts strings", () => {
    expect(
      readGenderLevelValue(
        { default: { default: 25 }, m: { default: 0 } },
        "m",
        "advanced",
      ),
    ).toBe(0);
    expect(
      readGenderLevelValue({ default: { default: "12" } }, "m", "advanced"),
    ).toBe(12);
    expect(readGenderLevelValue(undefined, "m", "advanced")).toBeUndefined();
  });
});

describe("startAndTargetValues: readAuthoredExerciseValue", () => {
  it("treats a value of 0 as not set", () => {
    expect(
      readAuthoredExerciseValue(
        { default: { default: 25 }, m: { default: 0 } },
        advancedMan,
      ),
    ).toBe(25);
  });

  it("returns the fallback without an authored value", () => {
    expect(readAuthoredExerciseValue(undefined, advancedMan, 7)).toBe(7);
    expect(
      readAuthoredExerciseValue({ w: { default: 9 } }, advancedMan, 7),
    ).toBe(7);
  });
});

describe("startAndTargetValues: hypertrophy range", () => {
  it.each([
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const)(
    "runs %s with weights %s from %p up to %p despite authored values",
    (mode, withWeights, start, target) => {
      expect(
        readRange(withWeights ? "SWR2" : "SWR2KG", mode, {
          withWeights,
          values: { [mode]: generateAuthoredValues("15", "80") },
        }),
      ).toEqual({ start, target });
    },
  );

  it("gives every gender and level the same range", () => {
    for (const gender of ["m", "w", "k"] as const) {
      for (const level of [
        "beginner",
        "intermediate",
        "advanced",
        "professional",
      ] as const) {
        expect(
          readRange("SWR2", "duration", {
            withWeights: true,
            athlete: { gender, level },
          }),
        ).toEqual({ start: 30, target: 50 });
      }
    }
  });

  it("reads authored repetitions only while the config does not override them", () => {
    const exercise = generateValueExercise("repetition", {
      withWeights: true,
      values: { repetition: generateAuthoredValues("15", "20") },
    });
    const intensity = loadIntensityConfig("SWR2");
    const withoutOverride: IntensityData = {
      ...intensity,
      overridesExerciseRepsAndDuration: false,
    };

    expect(
      readExerciseStartValue(intensity, exercise, "repetition", advancedMan),
    ).toBe(8);
    expect(
      readExerciseTargetValue(intensity, exercise, "repetition", advancedMan),
    ).toBe(12);
    expect(
      readExerciseStartValue(
        withoutOverride,
        exercise,
        "repetition",
        advancedMan,
      ),
    ).toBe(15);
    expect(
      readExerciseTargetValue(
        withoutOverride,
        exercise,
        "repetition",
        advancedMan,
      ),
    ).toBe(20);
  });

  it("reads the config start and target by gender and level", () => {
    const intensity: IntensityData = {
      ...loadIntensityConfig("SWR2"),
      startValue: {
        repetition: { default: { default: 6 } },
        duration: { default: { default: 20 }, m: { advanced: 25 } },
      },
      targetValue: {
        repetition: { default: { default: 10 } },
        duration: { default: { default: 40 }, m: { advanced: 45 } },
      },
    };
    const exercise = generateValueExercise("repetition", { withWeights: true });
    const advancedWoman = { gender: "w", level: "advanced" } as const;

    expect(
      readExerciseStartValue(intensity, exercise, "repetition", advancedMan),
    ).toBe(6);
    expect(
      readExerciseTargetValue(intensity, exercise, "repetition", advancedMan),
    ).toBe(10);
    expect(
      readExerciseStartValue(intensity, exercise, "duration", advancedMan),
    ).toBe(25);
    expect(
      readExerciseTargetValue(intensity, exercise, "duration", advancedWoman),
    ).toBe(40);
  });

  it("returns undefined without any start value", () => {
    const intensity: IntensityData = {
      adjustment: {},
      startValue: {},
      targetValue: {},
    };

    expect(
      readExerciseStartValue(
        intensity,
        generateValueExercise("duration"),
        "duration",
        advancedMan,
      ),
    ).toBeUndefined();
  });
});

describe("startAndTargetValues: load ranges", () => {
  it.each([
    ["SWR2", "beginner", 67.5, 75],
    ["SWR2", "advanced", 70, 77.5],
    ["SWR2", "professional", 70, 77.5],
    ["SK", "beginner", 52.5, 65],
    ["SK", "advanced", 55, 67.5],
    ["SK", "professional", 55, 70],
  ] as const)(
    "%s at level %s loads %d up to %d percent of F-Max",
    (intensityName, level, start, target) => {
      const intensity = loadIntensityConfig(intensityName);
      const exercise = generateValueExercise("repetition", {
        withWeights: true,
      });

      for (const gender of ["m", "w"] as const) {
        const athlete = { gender, level };
        expect(
          readExerciseStartValue(intensity, exercise, "weight", athlete),
        ).toBe(start);
        expect(
          readExerciseTargetValue(intensity, exercise, "weight", athlete),
        ).toBe(target);
      }
    },
  );

  it.each([
    ["SK", true],
    ["SKKG", false],
    ["SAKG", false],
  ] as const)(
    "%s with weights %s uses 4 up to 6 repetitions",
    (intensityName, withWeights) => {
      expect(readRange(intensityName, "repetition", { withWeights })).toEqual({
        start: 4,
        target: 6,
      });
    },
  );
});

describe("startAndTargetValues: full body stability and prevention", () => {
  it.each([
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const)(
    "GKS falls back to %s with weights %s from %p up to %p",
    (mode, withWeights, start, target) => {
      expect(
        readRange(withWeights ? "GKS" : "GKSKG", mode, { withWeights }),
      ).toEqual({ start, target });
    },
  );

  it.each(
    (["GKS", "GKSKG", "PREV"] as const).flatMap((intensityName) =>
      (["repetition", "duration"] as const).map((mode) => ({
        intensityName,
        mode,
      })),
    ),
  )(
    "$intensityName resolves $mode to the authored values",
    ({ intensityName, mode }) => {
      expect(
        readRange(intensityName, mode, {
          values: { [mode]: generateAuthoredValues("20", "80") },
        }),
      ).toEqual({ start: 20, target: 80 });
    },
  );

  it("resolves the empty gender value of the speed warm-up ladder 721 to 30 seconds", () => {
    expect(
      readExerciseStartValue(
        loadIntensityConfig("WUSKSA"),
        findCatalogExerciseById("721"),
        "duration",
        advancedMan,
      ),
    ).toBe(30);
  });
});

describe("startAndTargetValues: readAuthoredStartValues", () => {
  it("reads the start value of each authored value type", () => {
    const exercise = generateValueExercise("repetition", {
      values: {
        repetition: generateAuthoredValues("10", "15"),
        weight: generateAuthoredValues("20", "30"),
        duration: {
          startValue: { w: { default: 40 } },
          targetValue: { w: { default: 60 } },
        },
      },
    });

    expect(readAuthoredStartValues(exercise.values, "m", "advanced")).toEqual({
      repetition: 10,
      weight: 20,
    });
  });

  it("reads nothing without authored values", () => {
    expect(readAuthoredStartValues(null, "m", "advanced")).toEqual({});
  });
});

describe("startAndTargetValues: clampValueToStartAndTarget", () => {
  /**
   * Builds the value context of a weighted SWR2 exercise.
   *
   * generateContext()
   * → { intensity: <SWR2>, exercise: { tags: [..., "EQ_TYPE_WEIGHTS"], ... }, gender: "m", level: "advanced" }
   */
  const generateContext = () => ({
    intensity: loadIntensityConfig("SWR2"),
    exercise: generateValueExercise("repetition", { withWeights: true }),
    ...advancedMan,
  });

  it.each([
    [18, 12],
    [5, 8],
    [10, 10],
  ])("clamps %p repetitions to %p", (value, expected) => {
    expect(
      clampValueToStartAndTarget(value, "repetition", generateContext()),
    ).toBe(expected);
  });

  it("keeps the value without an intensity or a training level", () => {
    expect(
      clampValueToStartAndTarget(18, "repetition", {
        ...generateContext(),
        intensity: null,
      }),
    ).toBe(18);
    expect(
      clampValueToStartAndTarget(18, "repetition", {
        ...generateContext(),
        level: "",
      }),
    ).toBe(18);
  });
});

import {
  generateAuthoredValues,
  generateValueExercise,
} from "../../../../test/factories/valueExercise";
import { loadExercises } from "@/data/loadExercises";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  clampValueToStartAndTarget,
  readAuthoredExerciseValue,
  readAuthoredStartValues,
  readExerciseStartValue,
  readExerciseTargetValue,
  readGenderLevelValue,
} from "./startAndTargetValues";

const GENDERS: GenderTag[] = ["m", "w", "k"];
const LEVELS: TrainingLevelType[] = [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
];

const everyAthlete = GENDERS.flatMap((gender) =>
  LEVELS.map((level) => ({ gender, level })),
);

const readCatalogExercise = (id: string): ExerciseType => {
  const exercise = loadExercises().find((entry) => entry.id === id);
  if (!exercise) throw new Error(`Exercise ${id} missing from the catalog`);
  return exercise;
};

describe("startAndTargetValues: readGenderLevelValue", () => {
  const data = {
    default: { default: 1, advanced: 2 },
    m: { default: 3, advanced: 4 },
  };

  it.each([
    ["m", "advanced", 4],
    ["m", "beginner", 3],
    ["w", "advanced", 2],
    ["w", "beginner", 1],
  ])("reads gender %s and level %s as %p", (gender, level, expected) => {
    expect(readGenderLevelValue(data, gender, level)).toBe(expected);
  });

  it.each([[""], [null]])(
    "treats a gender value %p as not set",
    (genderValue) => {
      const values = { default: { default: 25 }, m: { default: genderValue } };

      expect(readGenderLevelValue(values, "m", "advanced")).toBe(25);
    },
  );

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
  const athlete = { gender: "m", level: "advanced" } as const;

  it("treats a value of 0 as not set", () => {
    expect(
      readAuthoredExerciseValue(
        { default: { default: 25 }, m: { default: 0 } },
        athlete,
      ),
    ).toBe(25);
  });

  it("returns the fallback without an authored value", () => {
    expect(readAuthoredExerciseValue(undefined, athlete, 7)).toBe(7);
    expect(readAuthoredExerciseValue({ w: { default: 9 } }, athlete, 7)).toBe(
      7,
    );
  });
});

describe("startAndTargetValues: hypertrophy range", () => {
  const cases = [
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const;

  it.each(
    everyAthlete.flatMap((athlete) =>
      cases.map(([mode, withWeights, start, target]) => ({
        ...athlete,
        mode,
        withWeights,
        start,
        target,
      })),
    ),
  )(
    "gender $gender, level $level: $mode with weights $withWeights runs $start up to $target",
    ({ gender, level, mode, withWeights, start, target }) => {
      const exercise = generateValueExercise(mode, {
        withWeights,
        values: { [mode]: generateAuthoredValues("15", "80") },
      });
      const intensity = loadIntensityConfig(withWeights ? "SWR2" : "SWR2KG");
      const athlete = { gender, level };

      expect(readExerciseStartValue(intensity, exercise, mode, athlete)).toBe(
        start,
      );
      expect(readExerciseTargetValue(intensity, exercise, mode, athlete)).toBe(
        target,
      );
    },
  );

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
    const athlete = { gender: "m", level: "advanced" } as const;

    expect(
      readExerciseStartValue(intensity, exercise, "repetition", athlete),
    ).toBe(8);
    expect(
      readExerciseTargetValue(intensity, exercise, "repetition", athlete),
    ).toBe(12);
    expect(
      readExerciseStartValue(withoutOverride, exercise, "repetition", athlete),
    ).toBe(15);
    expect(
      readExerciseTargetValue(withoutOverride, exercise, "repetition", athlete),
    ).toBe(20);
  });

  it("reads the config start and target by gender and level", () => {
    const base = loadIntensityConfig("SWR2");
    const intensity: IntensityData = {
      ...base,
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

    expect(
      readExerciseStartValue(intensity, exercise, "repetition", {
        gender: "m",
        level: "advanced",
      }),
    ).toBe(6);
    expect(
      readExerciseTargetValue(intensity, exercise, "repetition", {
        gender: "m",
        level: "advanced",
      }),
    ).toBe(10);
    expect(
      readExerciseStartValue(intensity, exercise, "duration", {
        gender: "m",
        level: "advanced",
      }),
    ).toBe(25);
    expect(
      readExerciseTargetValue(intensity, exercise, "duration", {
        gender: "w",
        level: "advanced",
      }),
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
        { gender: "m", level: "advanced" },
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
      const intensity = loadIntensityConfig(intensityName);
      const exercise = generateValueExercise("repetition", { withWeights });

      for (const gender of ["m", "w"] as const) {
        const athlete = { gender, level: "advanced" } as const;
        expect(
          readExerciseStartValue(intensity, exercise, "repetition", athlete),
        ).toBe(4);
        expect(
          readExerciseTargetValue(intensity, exercise, "repetition", athlete),
        ).toBe(6);
      }
    },
  );
});

describe("startAndTargetValues: full body stability and prevention", () => {
  const cases = [
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const;

  it.each(
    everyAthlete.flatMap((athlete) =>
      cases.map(([mode, withWeights, start, target]) => ({
        ...athlete,
        mode,
        withWeights,
        start,
        target,
      })),
    ),
  )(
    "GKS for gender $gender and level $level falls back to $start up to $target for $mode with weights $withWeights",
    ({ gender, level, mode, withWeights, start, target }) => {
      const exercise = generateValueExercise(mode, { withWeights });
      const intensity = loadIntensityConfig(withWeights ? "GKS" : "GKSKG");
      const athlete = { gender, level };

      expect(readExerciseStartValue(intensity, exercise, mode, athlete)).toBe(
        start,
      );
      expect(readExerciseTargetValue(intensity, exercise, mode, athlete)).toBe(
        target,
      );
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
      const exercise = generateValueExercise(mode, {
        values: { [mode]: generateAuthoredValues("20", "80") },
      });
      const intensity = loadIntensityConfig(intensityName);
      const athlete = { gender: "m", level: "advanced" } as const;

      expect(readExerciseStartValue(intensity, exercise, mode, athlete)).toBe(
        20,
      );
      expect(readExerciseTargetValue(intensity, exercise, mode, athlete)).toBe(
        80,
      );
    },
  );

  it("resolves the empty gender value of the speed warm-up ladder 721 to 30 seconds", () => {
    expect(
      readExerciseStartValue(
        loadIntensityConfig("WUSKSA"),
        readCatalogExercise("721"),
        "duration",
        { gender: "m", level: "advanced" },
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
  const context = {
    intensity: loadIntensityConfig("SWR2"),
    exercise: generateValueExercise("repetition", { withWeights: true }),
    gender: "m",
    level: "advanced",
  } as const;

  it.each([
    [18, 12],
    [5, 8],
    [10, 10],
  ])("clamps %p repetitions to %p", (value, expected) => {
    expect(clampValueToStartAndTarget(value, "repetition", context)).toBe(
      expected,
    );
  });

  it("keeps the value without an intensity or a training level", () => {
    expect(
      clampValueToStartAndTarget(18, "repetition", {
        ...context,
        intensity: null,
      }),
    ).toBe(18);
    expect(
      clampValueToStartAndTarget(18, "repetition", { ...context, level: "" }),
    ).toBe(18);
  });
});

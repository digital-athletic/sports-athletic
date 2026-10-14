import { getExerciseById } from "@/data/exerciseRegistry";
import type {
  ExerciseType,
  ExerciseValuesType,
} from "@/schemas/exercise.schema";
import {
  DEFAULT_MAX_VALUE,
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "../models/MaxValues";
import {
  calculateAdjustedMaxValues,
  deriveWeightForExercise,
  getMaxValueForExercise,
  getValueByGenderAndLevel,
} from "./workoutUtils";

const emptyValue: ExerciseValuesType = {
  startValue: { default: {}, m: {}, w: {}, k: {} },
  targetValue: { default: {}, m: {}, w: {}, k: {} },
};

const exerciseWithTags = (id: string, tags: string[]): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: `Exercise ${id}`,
  displayName: `Exercise ${id}`,
  description: "",
  picture: "",
  video: "",
  tags,
  values: {
    duration: emptyValue,
    repetition: emptyValue,
    height: emptyValue,
    weight: emptyValue,
  },
  isAdvanceByReps: false,
  isAdvanceByDuration: false,
  isJump: false,
});

describe("getMaxValueForExercise: equipment conversion of the barbell 1RM", () => {
  const oneRepMax = { ...DEFAULT_MAX_VALUE, barbell: 100 };
  const maxValues: MaxValuesType = {
    ...DEFAULT_MAX_VALUES,
    horizontalPush: oneRepMax,
    horizontalPull: oneRepMax,
    kneeDominant: oneRepMax,
  };

  it.each([
    { id: "342", exercise: "barbell bench press", expected: 100 },
    { id: "7", exercise: "dumbbell bench press", expected: 42.5 },
    { id: "509", exercise: "single arm dumbbell row", expected: 42.5 },
    { id: "362", exercise: "single leg barbell squat", expected: 45 },
    { id: "359", exercise: "single leg dumbbell squat", expected: 22.5 },
    { id: "346", exercise: "barbell incline bench press", expected: 90 },
    { id: "350", exercise: "dumbbell incline bench press", expected: 38.25 },
  ])("$exercise ($id): $expected kg", ({ id, expected }) => {
    const exercise = getExerciseById(id);
    expect(exercise).toBeDefined();
    expect(getMaxValueForExercise(exercise!, maxValues)).toBeCloseTo(
      expected,
      6,
    );
  });

  it("applies the conversion factor the catalog authors for the exercise", () => {
    const exercise = {
      ...exerciseWithTags("x", [
        "EQ_DUMBBELL",
        "EXERCISE_DIRECTION_KNEE",
        "SIDE_BOTH",
      ]),
      conversionFactor: 0.5,
    };
    expect(getMaxValueForExercise(exercise, maxValues)).toBeCloseTo(50, 6);
  });

  it("converts a single arm upper body barbell exercise at 42.5%", () => {
    const exercise = exerciseWithTags("x", [
      "EQ_BARBELL",
      "EXERCISE_DIRECTION_HORIZONTAL_PULL",
      "REGION_UPPER_BODY",
      "SIDE_ONE",
    ]);
    expect(getMaxValueForExercise(exercise, maxValues)).toBeCloseTo(42.5, 6);
  });

  it("converts a single leg barbell exercise at 45%", () => {
    const exercise = exerciseWithTags("x", [
      "EQ_BARBELL",
      "EXERCISE_DIRECTION_KNEE",
      "REGION_LOWER_BODY",
      "SIDE_ONE",
    ]);
    expect(getMaxValueForExercise(exercise, maxValues)).toBeCloseTo(45, 6);
  });

  it("applies the generic rule to incline bench tags without an authored factor", () => {
    const exercise = exerciseWithTags("x", [
      "EQ_DUMBBELL",
      "EQ_INCLINE_BENCH",
      "EXERCISE_DIRECTION_HORIZONTAL_PUSH",
      "SIDE_BOTH",
    ]);
    expect(getMaxValueForExercise(exercise, maxValues)).toBeCloseTo(42.5, 6);
  });

  it("returns undefined for an exercise without a tested movement direction", () => {
    const lowerBodyExercise = exerciseWithTags("x", [
      "EQ_BARBELL",
      "REGION_LOWER_BODY",
    ]);
    const allDirections: MaxValuesType = {
      ...maxValues,
      lowerBody: oneRepMax,
      verticalPull: oneRepMax,
    };
    expect(
      getMaxValueForExercise(lowerBodyExercise, allDirections),
    ).toBeUndefined();
  });
});

describe("calculateAdjustedMaxValues: equipment conversion", () => {
  it("converts the barbell 1RM by the equipment variant", () => {
    const result = calculateAdjustedMaxValues(100);
    expect(result).toEqual({
      barbell: 100,
      dumbbells: 42.5,
      oneSidedUpper: 42.5,
      oneSidedBarbell: 45,
      oneSidedLower: 22.5,
      oneSidedLowerSupported: 30,
    });
  });
});

describe("catalog conversion factors", () => {
  it.each([
    ...["346", "347", "348", "349"].map((id) => ({ id, factor: 0.9 })),
    ...["350", "351", "352", "353", "354", "382", "393", "394"].map((id) => ({
      id,
      factor: 0.3825,
    })),
    { id: "292", factor: 1 },
    { id: "294", factor: 0.5 },
  ])("exercise $id carries the factor $factor", ({ id, factor }) => {
    expect(getExerciseById(id)?.conversionFactor).toBe(factor);
  });
});

describe("jump squat: authored loads from the squat 1RM", () => {
  it.each([
    { level: "beginner", start: 5, target: 10 },
    { level: "advanced", start: 10, target: 20 },
    { level: "professional", start: 10, target: 20 },
  ] as const)(
    "$level: starts at $start% and targets $target% of the squat 1RM",
    ({ level, start, target }) => {
      for (const id of ["292", "294"]) {
        const weight = getExerciseById(id)?.values?.weight;
        for (const gender of ["m", "w"] as const) {
          expect(
            getValueByGenderAndLevel(weight?.startValue, gender, level),
          ).toBe(start);
          expect(
            getValueByGenderAndLevel(weight?.targetValue, gender, level),
          ).toBe(target);
        }
      }
    },
  );
});

describe("catalog conversion factors: prescribed weight end to end", () => {
  const oneRepMax = { ...DEFAULT_MAX_VALUE, barbell: 100 };
  const maxValues: MaxValuesType = {
    ...DEFAULT_MAX_VALUES,
    horizontalPush: oneRepMax,
    kneeDominant: oneRepMax,
  };

  const prescribedWeight = (id: string, percentOfOneRepMax: number) =>
    deriveWeightForExercise(
      percentOfOneRepMax,
      "weightFMax",
      getExerciseById(id)!,
      maxValues,
    );

  // 100 kg bench press 1RM: barbell 90 kg, dumbbell 38.25 kg per hand rounded to 2 kg steps
  it.each([
    { id: "346", expected: 90 },
    { id: "350", expected: 38 },
  ])(
    "incline bench press $id at 100% of the adjusted max: $expected kg",
    ({ id, expected }) => {
      expect(prescribedWeight(id, 100)).toBe(expected);
    },
  );

  // 100 kg squat 1RM: the barbell carries the total load, each dumbbell half of it
  it.each([
    { level: "beginner", start: 5, target: 10, perDumbbell: [2, 5] },
    { level: "advanced", start: 10, target: 20, perDumbbell: [5, 10] },
    { level: "professional", start: 10, target: 20, perDumbbell: [5, 10] },
  ] as const)(
    "$level jump squat: $start kg to $target kg on the barbell, $perDumbbell kg per dumbbell",
    ({ level, start, target, perDumbbell }) => {
      const load = (id: string, value: "startValue" | "targetValue") => {
        const percent = getValueByGenderAndLevel(
          getExerciseById(id)?.values?.weight?.[value],
          "m",
          level,
        );
        return prescribedWeight(id, Number(percent));
      };

      expect(load("292", "startValue")).toBe(start);
      expect(load("292", "targetValue")).toBe(target);
      expect(load("294", "startValue")).toBe(perDumbbell[0]);
      expect(load("294", "targetValue")).toBe(perDumbbell[1]);
    },
  );

  it("splits a total load of 10 kg into 5 kg per dumbbell", () => {
    expect(prescribedWeight("294", 10)).toBe(5);
  });
});

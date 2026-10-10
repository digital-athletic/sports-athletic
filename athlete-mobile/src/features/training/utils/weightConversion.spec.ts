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

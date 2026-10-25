import {
  generateAuthoredValues,
  generateValueExercise,
} from "@test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import type { IntensityData } from "@/features/training/models/Intensity";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  adjustExerciseValuesByFeedback,
  readFeedbackAdjustment,
} from "./feedbackAdjustment";

const DURATION_STEPS = { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -10 };

describe("feedbackAdjustment: readFeedbackAdjustment", () => {
  // The intensity configs of the standard skills.
  it.each([
    ["SWR2", "5 to 10 seconds", DURATION_STEPS],
    ["SWR2KG", "5 to 10 seconds", DURATION_STEPS],
    ["SA", "no step", undefined],
    ["SAKG", "no step", undefined],
    ["SK", "no step", undefined],
    ["SKKG", "no step", undefined],
    ["BAS", "5 to 10 seconds", DURATION_STEPS],
    ["GKS", "5 to 10 seconds", DURATION_STEPS],
    ["GKSKG", "5 to 10 seconds", DURATION_STEPS],
    ["PREV", "5 to 10 seconds", DURATION_STEPS],
  ])(
    "%s moves repetitions one or two ladder steps and duration by %s",
    (name, _label, duration) => {
      const adjustment = readFeedbackAdjustment(
        loadIntensityConfig(name),
        "m",
        "advanced",
      );

      expect(adjustment.repetition).toEqual({
        SUCCEEDED: 1,
        TOO_EASY: 2,
        TOO_HARD: -2,
      });
      expect(adjustment.duration).toEqual(duration);
    },
  );

  it("reads gender and level, then the level default, then the default", () => {
    const step = (value: number) => ({
      SUCCEEDED: value,
      TOO_EASY: value,
      TOO_HARD: value,
    });
    const intensity: IntensityData = {
      startValue: {},
      targetValue: {},
      adjustment: {
        repetition: {
          default: { default: step(1), advanced: step(2) },
          m: { advanced: step(3) },
        },
      },
    };

    expect(readFeedbackAdjustment(intensity, "m", "advanced")).toEqual({
      repetition: step(3),
    });
    expect(readFeedbackAdjustment(intensity, "m", "beginner")).toEqual({
      repetition: step(1),
    });
    expect(readFeedbackAdjustment(intensity, "w", "advanced")).toEqual({
      repetition: step(2),
    });
  });

  it("uses fixed steps without an intensity", () => {
    expect(readFeedbackAdjustment(null, "m", "advanced")).toEqual({
      duration: { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -5 },
      height: { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -5 },
      repetition: { SUCCEEDED: 2, TOO_EASY: 4, TOO_HARD: -2 },
      weightFMax: { SUCCEEDED: 2.5, TOO_EASY: 5, TOO_HARD: -2.5 },
      weightAbsolute: { SUCCEEDED: 1, TOO_EASY: 2, TOO_HARD: -1 },
    });
  });
});

describe("feedbackAdjustment: adjustExerciseValuesByFeedback", () => {
  /**
   * Builds the value context of an advanced man.
   *
   * generateContext("SWR2KG", generateValueExercise("repetition"))
   * → { intensity: <SWR2KG>, exercise: { id: "1", ... }, gender: "m", level: "advanced" }
   */
  const generateContext = (intensityName: string, exercise: ExerciseType) =>
    ({
      intensity: loadIntensityConfig(intensityName),
      exercise,
      gender: "m",
      level: "advanced",
    }) as const;

  it("stops TOO_EASY at the hypertrophy target despite a higher authored target", () => {
    const exercise = generateValueExercise("repetition", {
      values: { repetition: generateAuthoredValues("12", "20") },
    });

    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 11, weightType: "weightAbsolute" },
        generateContext("SWR2KG", exercise),
        "TOO_EASY",
        DEFAULT_MAX_VALUES,
      ).repetition,
    ).toBe(12);
  });

  it.each([
    ["SWR2", 70, 68.25],
    ["SWR2", 66, 65],
    ["SK", 52, 50.7],
    ["SK", 51, 50],
  ])(
    "%s lowers %p percent of F-Max on TOO_HARD to %p",
    (intensityName, weight, expected) => {
      const values = adjustExerciseValuesByFeedback(
        { repetition: 10, weight, weightType: "weightFMax" },
        generateContext(
          intensityName,
          generateValueExercise("repetition", { withWeights: true }),
        ),
        "TOO_HARD",
        DEFAULT_MAX_VALUES,
      );

      expect(values.weight).toBeCloseTo(expected);
      expect(values.repetition).toBe(10);
    },
  );

  it("lowers the load to the next real barbell load", () => {
    const exercise = generateValueExercise("repetition", {
      withWeights: true,
      tags: ["EQ_BARBELL", "EXERCISE_DIRECTION_HIP"],
    });
    const maxValues = {
      ...DEFAULT_MAX_VALUES,
      hipHinge: { ...DEFAULT_MAX_VALUES.hipHinge, barbell: 100 },
    };

    const values = adjustExerciseValuesByFeedback(
      { repetition: 10, weight: 73.5, weightType: "weightFMax" },
      generateContext("SWR2", exercise),
      "TOO_HARD",
      maxValues,
    );

    // 73.5 % of 100 kg rounds to 72.5 kg, 72.5 kg x 0.975 rounds to 70 kg.
    expect(values.weight).toBeCloseTo(70);
  });

  it("keeps the authored height of a jump exercise", () => {
    const exercise = generateValueExercise("repetition", { isJump: true });

    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 8, height: 20, weightType: "weightAbsolute" },
        generateContext("SWR2KG", exercise),
        "SUCCEEDED",
        DEFAULT_MAX_VALUES,
      ),
    ).toEqual({ repetition: 9, height: 20, weightType: "weightAbsolute" });
  });

  it("lowers repetitions of an exercise without weights on TOO_HARD down to the start", () => {
    const context = generateContext(
      "SWR2KG",
      generateValueExercise("repetition"),
    );

    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 12, weightType: "weightAbsolute" },
        context,
        "TOO_HARD",
        DEFAULT_MAX_VALUES,
      ).repetition,
    ).toBe(10);
    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 9, weightType: "weightAbsolute" },
        context,
        "TOO_HARD",
        DEFAULT_MAX_VALUES,
      ).repetition,
    ).toBe(8);
  });

  it("uses the fixed steps without an intensity", () => {
    expect(
      adjustExerciseValuesByFeedback(
        { duration: 40, weightType: "weightAbsolute" },
        {
          intensity: null,
          exercise: generateValueExercise("duration"),
          gender: "m",
          level: "advanced",
        },
        "TOO_EASY",
        DEFAULT_MAX_VALUES,
      ).duration,
    ).toBe(50);
  });
});

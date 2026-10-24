import {
  generateAuthoredValues,
  generateValueExercise,
} from "../../../../test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  adjustExerciseValuesByFeedback,
  readFeedbackAdjustment,
} from "./feedbackAdjustment";

const GENDERS: GenderTag[] = ["m", "w", "k"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional"];
// The intensity configs of the standard skills.
const STANDARD_INTENSITIES = [
  "SWR2",
  "SWR2KG",
  "SA",
  "SAKG",
  "SK",
  "SKKG",
  "BAS",
  "GKS",
  "GKSKG",
  "PREV",
];

describe("feedbackAdjustment: readFeedbackAdjustment", () => {
  it.each(
    STANDARD_INTENSITIES.flatMap((name) =>
      GENDERS.flatMap((gender) =>
        LEVELS.map((level) => [name, gender, level] as const),
      ),
    ),
  )(
    "%s for gender %s and level %s moves one or two ladder steps",
    (name, gender, level) => {
      const adjustment = readFeedbackAdjustment(
        loadIntensityConfig(name),
        gender,
        level,
      );

      expect(adjustment.repetition).toEqual({
        SUCCEEDED: 1,
        TOO_EASY: 2,
        TOO_HARD: -2,
      });
      if (adjustment.duration) {
        expect(adjustment.duration).toEqual({
          SUCCEEDED: 5,
          TOO_EASY: 10,
          TOO_HARD: -10,
        });
      }
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
  const generateContext = (intensityName: string, exercise: ExerciseType) => ({
    intensity: loadIntensityConfig(intensityName),
    exercise,
    gender: "m",
    level: "advanced",
  } as const);

  it("stops TOO_EASY at the hypertrophy target despite a higher authored target", () => {
    const exercise = generateValueExercise("repetition", {
      values: { repetition: generateAuthoredValues("12", "20") },
    });

    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 11, weightType: "weightAbsolute" },
        generateContext("SWR2KG", exercise),
        "TOO_EASY",
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
    const exercise = {
      ...generateValueExercise("repetition"),
      isJump: true,
    };

    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 8, height: 20, weightType: "weightAbsolute" },
        generateContext("SWR2KG", exercise),
        "SUCCEEDED",
      ),
    ).toEqual({ repetition: 9, height: 20, weightType: "weightAbsolute" });
  });

  it("lowers repetitions of an exercise without weights on TOO_HARD down to the start", () => {
    const context = generateContext("SWR2KG", generateValueExercise("repetition"));

    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 12, weightType: "weightAbsolute" },
        context,
        "TOO_HARD",
      ).repetition,
    ).toBe(10);
    expect(
      adjustExerciseValuesByFeedback(
        { repetition: 9, weightType: "weightAbsolute" },
        context,
        "TOO_HARD",
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
      ).duration,
    ).toBe(50);
  });
});

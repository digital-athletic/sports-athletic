import { generateValueExercise } from "@test/factories/valueExercise";
import type { IntensityData } from "@/features/training/models/Intensity";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type {
  DifficultyFeedbackType,
  ExerciseValuesData,
} from "@/schemas/generator.schema";
import { adjustExerciseValuesByFeedback } from "./feedbackAdjustment";

/**
 * Builds the authored start and target of one value for an intermediate man.
 *
 * generateIntermediateRange("10", "15")
 * → { startValue: { default: { intermediate: "10" }, m: { intermediate: "10" } }, targetValue: { ... "15" } }
 */
const generateIntermediateRange = (start: string, target: string) => ({
  startValue: {
    default: { intermediate: start },
    m: { intermediate: start },
  },
  targetValue: {
    default: { intermediate: target },
    m: { intermediate: target },
  },
});

const WEIGHT_RANGE = {
  startValue: {
    default: { intermediate: "20" },
    m: { intermediate: "20" },
    type: { type: "weightAbsolute" as const },
  },
  targetValue: {
    default: { intermediate: "30" },
    m: { intermediate: "30" },
    type: { type: "weightAbsolute" as const },
  },
};

const generateRepetitionExercise = (
  options: { withWeights?: boolean; isJump?: boolean; tags?: string[] } = {},
): ExerciseType =>
  generateValueExercise("repetition", {
    ...options,
    values: {
      repetition: generateIntermediateRange("10", "15"),
      weight: WEIGHT_RANGE,
    },
  });

const generateDurationExercise = (): ExerciseType =>
  generateValueExercise("duration", {
    values: { duration: generateIntermediateRange("20", "30") },
  });

const adjustWithoutIntensity = (
  values: ExerciseValuesData,
  exercise: ExerciseType,
  feedback: DifficultyFeedbackType,
): ExerciseValuesData =>
  adjustExerciseValuesByFeedback(
    values,
    { intensity: null, exercise, gender: "m", level: "intermediate" },
    feedback,
    DEFAULT_MAX_VALUES,
  );

const BASE_VALUES: ExerciseValuesData = {
  duration: 30,
  repetition: 10,
  height: 50,
  weight: 20,
  weightType: "weightAbsolute",
};

describe("feedbackAdjustmentRules: fixed steps without an intensity", () => {
  it("raises the duration of a duration exercise on TOO_EASY", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateDurationExercise(),
      "TOO_EASY",
    );

    expect(result.duration).toBe(40);
  });

  it("lowers the duration of a duration exercise on TOO_HARD", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateDurationExercise(),
      "TOO_HARD",
    );

    expect(result.duration).toBe(25);
  });

  it("raises the repetitions of a repetition exercise on TOO_EASY", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateRepetitionExercise(),
      "TOO_EASY",
    );

    expect(result.repetition).toBe(14);
  });

  it("lowers the repetitions of a repetition exercise on TOO_HARD", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateRepetitionExercise(),
      "TOO_HARD",
    );

    expect(result.repetition).toBe(8);
  });

  it("raises the repetitions by 2 on SUCCEEDED and keeps the duration", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateRepetitionExercise(),
      "SUCCEEDED",
    );

    expect({
      duration: result.duration,
      repetition: result.repetition,
    }).toEqual({ duration: 30, repetition: 12 });
  });

  it("keeps the height of a jump exercise on TOO_EASY", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateRepetitionExercise({ isJump: true }),
      "TOO_EASY",
    );

    expect(result.height).toBe(50);
  });

  it("leaves an undefined weight undefined", () => {
    const { weight: _weight, ...valuesWithoutWeight } = BASE_VALUES;

    const result = adjustWithoutIntensity(
      valuesWithoutWeight,
      generateRepetitionExercise(),
      "TOO_EASY",
    );

    expect(result.weight).toBeUndefined();
  });
});

describe("feedbackAdjustmentRules: weight steps", () => {
  const weighted = () => generateRepetitionExercise({ withWeights: true });

  it("lowers an absolute weight of 20 kg to 19 kg on TOO_HARD and keeps the repetitions", () => {
    const result = adjustWithoutIntensity(BASE_VALUES, weighted(), "TOO_HARD");

    expect({ weight: result.weight, repetition: result.repetition }).toEqual({
      weight: 19,
      repetition: 10,
    });
  });

  it.each(["TOO_EASY", "SUCCEEDED"] as const)(
    "keeps the weight and raises only the repetitions on %s",
    (feedback) => {
      const result = adjustWithoutIntensity(BASE_VALUES, weighted(), feedback);

      expect(result.weight).toBe(20);
      expect(result.repetition).toBeGreaterThan(10);
    },
  );

  it("keeps the weight of an exercise without adjustable weight on TOO_HARD", () => {
    const result = adjustWithoutIntensity(
      BASE_VALUES,
      generateRepetitionExercise(),
      "TOO_HARD",
    );

    expect(result.weight).toBe(20);
  });

  it("lowers a weight of 80 percent of F-Max to 78 on TOO_HARD", () => {
    const result = adjustWithoutIntensity(
      { ...BASE_VALUES, weight: 80, weightType: "weightFMax" },
      weighted(),
      "TOO_HARD",
    );

    expect(result.weight).toBe(78);
  });

  it("stores the rounded reduced barbell load as the weight", () => {
    const barbell = generateRepetitionExercise({
      withWeights: true,
      tags: ["EQ_BARBELL"],
    });

    const result = adjustWithoutIntensity(
      { ...BASE_VALUES, weight: 42.5 },
      barbell,
      "TOO_HARD",
    );

    // 42.5 kg x 0.975 is 41.44 kg and rounds to 42.5 kg, so the step forces 40 kg
    expect(result.weight).toBe(40);
  });

  it("lowers a light absolute weight to 0 kg and no lower", () => {
    const result = adjustWithoutIntensity(
      { ...BASE_VALUES, weight: 0.5 },
      weighted(),
      "TOO_HARD",
    );

    expect(result.weight).toBe(0);
  });
});

describe("feedbackAdjustmentRules: one change per feedback within the boundaries", () => {
  const ladderIntensity: IntensityData = {
    startValue: {},
    targetValue: {},
    adjustment: {
      repetition: {
        default: { default: { SUCCEEDED: 1, TOO_EASY: 2, TOO_HARD: -2 } },
      },
      duration: {
        default: { default: { SUCCEEDED: 5, TOO_EASY: 10, TOO_HARD: -10 } },
      },
      weightAbsolute: {
        default: { default: { SUCCEEDED: 1, TOO_EASY: 2, TOO_HARD: -1 } },
      },
    },
  };

  const weightedRepsExercise = generateValueExercise("repetition", {
    withWeights: true,
    values: {
      repetition: {
        startValue: { m: { intermediate: "8" } },
        targetValue: { m: { intermediate: "12" } },
      },
    },
  });
  const unweightedRepsExercise = generateValueExercise("repetition", {
    values: weightedRepsExercise.values,
  });
  const weightedDurationExercise = generateValueExercise("duration", {
    withWeights: true,
    values: {
      duration: {
        startValue: { m: { intermediate: "30" } },
        targetValue: { m: { intermediate: "50" } },
      },
    },
  });

  const adjust = (
    exercise: ExerciseType,
    values: { repetition?: number; duration?: number; weight?: number },
    feedback: DifficultyFeedbackType,
  ): ExerciseValuesData =>
    adjustExerciseValuesByFeedback(
      { ...values, weightType: "weightAbsolute" },
      {
        intensity: ladderIntensity,
        exercise,
        gender: "m",
        level: "intermediate",
      },
      feedback,
      DEFAULT_MAX_VALUES,
    );

  it.each([
    [8, "SUCCEEDED", 9],
    [9, "TOO_EASY", 11],
    [11, "TOO_EASY", 12],
  ] as const)(
    "worked example: %i reps with %s gives %i reps at the same weight",
    (repetition, feedback, expectedRepetition) => {
      const result = adjust(
        weightedRepsExercise,
        { repetition, weight: 38 },
        feedback,
      );

      expect({ repetition: result.repetition, weight: result.weight }).toEqual({
        repetition: expectedRepetition,
        weight: 38,
      });
    },
  );

  it("worked example: TOO_HARD on a weighted exercise reduces only the weight", () => {
    const result = adjust(
      weightedRepsExercise,
      { repetition: 8, weight: 39 },
      "TOO_HARD",
    );

    expect({ repetition: result.repetition, weight: result.weight }).toEqual({
      repetition: 8,
      weight: 38,
    });
  });

  it("clamps weighted duration at the target", () => {
    const result = adjust(
      weightedDurationExercise,
      { duration: 45, weight: 38 },
      "TOO_EASY",
    );

    expect({ duration: result.duration, weight: result.weight }).toEqual({
      duration: 50,
      weight: 38,
    });
  });

  it("clamps unweighted repetitions at the target", () => {
    const result = adjust(
      unweightedRepsExercise,
      { repetition: 11 },
      "TOO_EASY",
    );

    expect(result.repetition).toBe(12);
  });

  it("clamps unweighted repetitions at the start value on TOO_HARD", () => {
    const result = adjust(
      unweightedRepsExercise,
      { repetition: 9 },
      "TOO_HARD",
    );

    expect(result.repetition).toBe(8);
  });
});

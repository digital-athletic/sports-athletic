import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { DEFAULT_MAX_VALUE, DEFAULT_MAX_VALUES } from "../models/MaxValues";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import {
  calculateMaxStrengthAdjustment,
  type MaxStrengthAdjustmentInput,
} from "./maxStrengthAdjustment";
import type {
  ExerciseType,
  ExerciseValuesType,
} from "@/schemas/exercise.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import { createExerciseData } from "./testFixtures";

// For ADULT/ADVANCED without catalog values the final weight is 80% (the
// highest weight in the repetition table) and the minimum is 70%.

// A LOWER_BODY barbell exercise resolves to maxValues.lowerBody.barbell.
const lowerBodyExercise = { tags: ["REGION_LOWER_BODY"] } as ExerciseType;

const maxValuesWith = (barbell: number): MaxValuesType => ({
  ...DEFAULT_MAX_VALUES,
  lowerBody: { ...DEFAULT_MAX_VALUE, barbell },
});

const userExerciseWith = (
  maxFRepetitions: MaxForceRepetitionsDataType[],
): UserExerciseDataType =>
  ({ maxFRepetitions }) as unknown as UserExerciseDataType;

// weight / maxValue * 100 gives the weight percentage the branches compare.
const baseInput: MaxStrengthAdjustmentInput = {
  weight: 120,
  adjustment: "SUCCEEDED",
  exerciseData: lowerBodyExercise,
  userExerciseData: userExerciseWith([{ level: "HARD", repetitions: 3 }]),
  maxValues: maxValuesWith(200), // 120/200 => 60% weight percentage
  ageGroup: "ADULT",
  genderTag: "m",
  levelTag: "ADVANCED",
  userLevel: "advanced",
};

// The ladder tests below follow the Advanced level in
// docs/specs/progression/max-strength-progression.md.
// F-Max is 100 kg, so the lifted weight in kg equals the percentage of F-Max.
const exerciseWith = (weightValues: Partial<ExerciseValuesType>) =>
  createExerciseData({
    tags: ["REGION_LOWER_BODY"],
    values: { weight: { startValue: {}, targetValue: {}, ...weightValues } },
  });

// Same target value as the barbell squat (id 26): Advanced ends at 80%.
const squatLike = exerciseWith({
  targetValue: { default: { advanced: 80 } },
});

const adjust = (
  weight: number,
  level: MaxForceRepetitionsDataType["level"],
  adjustment: MaxStrengthAdjustmentInput["adjustment"],
  exerciseData: ExerciseType = squatLike,
) =>
  calculateMaxStrengthAdjustment({
    ...baseInput,
    weight,
    adjustment,
    exerciseData,
    maxValues: maxValuesWith(100),
    userExerciseData: userExerciseWith([{ level, repetitions: 3 }]),
  });

describe("calculateMaxStrengthAdjustment", () => {
  it("raises a weight below the minimum to the minimum", () => {
    const result = calculateMaxStrengthAdjustment(baseInput);

    expect(result.weightAdjusted).toBe(true);
    expect(result.nextWeightPercentage).toBe(70);
  });

  it("levels up instead of adjusting weight once the max percentage is reached", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      weight: 80,
      maxValues: maxValuesWith(100), // 80% is the final Advanced weight
    });

    expect(result.levelUp).toBe(true);
    expect(result.feedbackOverride).toEqual({ difficulty: null });
  });

  it("levels down when TOO_HARD at or below the minimum percentage", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      adjustment: "TOO_HARD", // 60% is below the 70% minimum
      userExerciseData: userExerciseWith([{ level: "EASY", repetitions: 6 }]),
    });

    expect(result.levelDown).toBe(true);
    expect(result.feedbackOverride).toEqual({ difficulty: null });
  });

  it("makes no change on neutral feedback below the minimum at EASY level", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      userExerciseData: userExerciseWith([{ level: "EASY", repetitions: 6 }]),
    });

    expect(result.weightAdjusted).toBe(false);
    expect(result.nextWeightPercentage).toBe(60);
  });

  it("carries maxFRepetitions through unchanged", () => {
    const reps: MaxForceRepetitionsDataType[] = [
      { level: "MEDIUM", repetitions: 5 },
      { level: "HARD", repetitions: 3 },
    ];
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      userExerciseData: userExerciseWith(reps),
    });

    expect(result.maxFRepetitions).toEqual(reps);
  });

  it("returns undefined nextWeightPercentage when the max value is unknown", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      exerciseData: undefined,
    });

    expect(result.nextWeightPercentage).toBeUndefined();
  });
});

describe("calculateMaxStrengthAdjustment: upper end of the Advanced ladder", () => {
  it("advances two steps on TOO_EASY below the final value and keeps the exercise", () => {
    const result = adjust(75, "MEDIUM", "TOO_EASY");

    expect(result.levelUp).toBe(false);
    expect(result.nextWeightPercentage).toBe(77.5);
  });

  it("stops at the final value on TOO_EASY from the MEDIUM column at 80%", () => {
    const result = adjust(80, "MEDIUM", "TOO_EASY");

    expect(result.levelUp).toBe(false);
    expect(result.nextWeightPercentage).toBe(80);
    expect(result.feedbackOverride).toEqual({ difficulty: "SUCCEEDED" });
  });

  it("swaps to the harder exercise on SUCCEEDED at the final value", () => {
    const result = adjust(80, "HARD", "SUCCEEDED");

    expect(result.levelUp).toBe(true);
  });

  it("takes the final weight from the repetition table without a target value", () => {
    const result = adjust(77.5, "HARD", "SUCCEEDED", exerciseWith({}));

    expect(result.levelUp).toBe(false);
    expect(result.nextWeightPercentage).toBe(80);
  });
});

describe("calculateMaxStrengthAdjustment: lower end of the Advanced ladder", () => {
  it("lowers the weight by 2.5 percentage points on TOO_HARD", () => {
    const result = adjust(77.5, "HARD", "TOO_HARD");

    expect(result.levelDown).toBe(false);
    expect(result.nextWeightPercentage).toBe(75);
  });

  it("lowers the weight to the 70% minimum on TOO_HARD instead of swapping", () => {
    const result = adjust(72.5, "EASY", "TOO_HARD");

    expect(result.levelDown).toBe(false);
    expect(result.nextWeightPercentage).toBe(70);
  });

  it("swaps to the easier exercise on TOO_HARD at the 70% minimum", () => {
    const result = adjust(70, "EASY", "TOO_HARD");

    expect(result.levelDown).toBe(true);
  });

  it("lowers the weight below the start value on TOO_HARD", () => {
    const withStart = exerciseWith({
      startValue: { default: { advanced: 72.5 } },
      targetValue: { default: { advanced: 80 } },
    });
    const result = adjust(72.5, "EASY", "TOO_HARD", withStart);

    expect(result.levelDown).toBe(false);
    expect(result.nextWeightPercentage).toBe(70);
  });
});

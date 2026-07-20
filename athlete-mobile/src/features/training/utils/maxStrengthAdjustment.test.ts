import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { DEFAULT_MAX_VALUE, DEFAULT_MAX_VALUES } from "../models/MaxValues";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import {
  calculateMaxStrengthAdjustment,
  type MaxStrengthAdjustmentInput,
} from "./maxStrengthAdjustment";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";

// Locks the current behavior of the logic extracted verbatim from
// training-active.tsx. Expectations encode a known quirk: for ADULT/ADVANCED
// the max weight percentage collapses to 65% (a `.map(parseInt)` radix bug)
// while the min is 70%, so a weight adjustment always lands on the 65% cap.
// Update these deliberately once those bugs are fixed.

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

describe("calculateMaxStrengthAdjustment", () => {
  it("increases weight below the max, clamped to the capped max percentage", () => {
    const result = calculateMaxStrengthAdjustment(baseInput);

    expect(result.weightAdjusted).toBe(true);
    expect(result.nextWeightPercentage).toBe(65);
  });

  it("levels up instead of adjusting weight once the max percentage is reached", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      weight: 70,
      maxValues: maxValuesWith(100), // 70% >= 65% max
    });

    expect(result.levelUp).toBe(true);
    expect(result.feedbackOverride).toEqual({ difficulty: null });
  });

  it("levels down when TOO_HARD at or below the minimum percentage", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      adjustment: "TOO_HARD", // 60% <= 70% min
      userExerciseData: userExerciseWith([{ level: "EASY", repetitions: 6 }]),
    });

    expect(result.levelDown).toBe(true);
    expect(result.feedbackOverride).toEqual({ difficulty: null });
  });

  it("levels up on MEDIUM reps with TOO_EASY feedback regardless of weight", () => {
    const result = calculateMaxStrengthAdjustment({
      ...baseInput,
      adjustment: "TOO_EASY",
      userExerciseData: userExerciseWith([{ level: "MEDIUM", repetitions: 5 }]),
    });

    expect(result.levelUp).toBe(true);
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

import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type { UserExerciseDataType } from "../models/UserExerciseData";
import {
  calculateMaxStrengthAdjustment,
  type MaxStrengthAdjustmentInput,
} from "./maxStrengthAdjustment";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";

const userExerciseWith = (
  maxFRepetitions: MaxForceRepetitionsDataType[],
): UserExerciseDataType => ({
  exerciseId: "26",
  skill: "MAX_KRAFT",
  maxFRepetitions,
});

// Only the last working set decides the end of the exercise.
const advancedWithLastSet = (
  lastSet: MaxForceRepetitionsDataType,
): UserExerciseDataType =>
  userExerciseWith([
    { level: "HARD", repetitions: 6, weightPercentage: 70 },
    { level: "HARD", repetitions: 5, weightPercentage: 75 },
    lastSet,
  ]);

const input = (
  adjustment: ExerciseDifficultyType,
  userExerciseData: UserExerciseDataType,
  levelTag: MaxStrengthAdjustmentInput["levelTag"] = "ADVANCED",
): MaxStrengthAdjustmentInput => ({
  adjustment,
  userExerciseData,
  ageGroup: "ADULT",
  levelTag,
});

describe("calculateMaxStrengthAdjustment: final value", () => {
  it.each<ExerciseDifficultyType>(["SUCCEEDED", "TOO_EASY"])(
    "Advanced: %s at 80%% x 3 switches to the harder exercise",
    (adjustment) => {
      const result = calculateMaxStrengthAdjustment(
        input(
          adjustment,
          advancedWithLastSet({
            level: "HARD",
            repetitions: 3,
            weightPercentage: 80,
          }),
        ),
      );

      expect(result.levelUp).toBe(true);
      expect(result.levelDown).toBe(false);
      expect(result.feedbackOverride).toEqual({ difficulty: null });
    },
  );

  it("Pro: succeeded at 90% x 2 switches to the harder exercise", () => {
    const result = calculateMaxStrengthAdjustment(
      input(
        "SUCCEEDED",
        userExerciseWith([
          { level: "HARD", repetitions: 6, weightPercentage: 75 },
          { level: "HARD", repetitions: 5, weightPercentage: 80 },
          { level: "HARD", repetitions: 3, weightPercentage: 85 },
          { level: "HARD", repetitions: 2, weightPercentage: 90 },
        ]),
        "PROFESSIONAL",
      ),
    );

    expect(result.levelUp).toBe(true);
  });

  it("Pro: too easy at 87.5% x 2 keeps the exercise", () => {
    const result = calculateMaxStrengthAdjustment(
      input(
        "TOO_EASY",
        userExerciseWith([
          { level: "HARD", repetitions: 6, weightPercentage: 75 },
          { level: "HARD", repetitions: 5, weightPercentage: 80 },
          { level: "HARD", repetitions: 3, weightPercentage: 85 },
          { level: "HARD", repetitions: 2, weightPercentage: 87.5 },
        ]),
        "PROFESSIONAL",
      ),
    );

    expect(result.levelUp).toBe(false);
    expect(result.feedbackOverride).toBeUndefined();
  });

  it.each<[string, MaxForceRepetitionsDataType]>([
    ["77.5% x 3", { level: "MEDIUM", repetitions: 3, weightPercentage: 77.5 }],
    ["80% x 2", { level: "MEDIUM", repetitions: 2, weightPercentage: 80 }],
  ])("Advanced: too easy at %s keeps the exercise", (_, lastSet) => {
    const result = calculateMaxStrengthAdjustment(
      input("TOO_EASY", advancedWithLastSet(lastSet)),
    );

    expect(result.levelUp).toBe(false);
    expect(result.levelDown).toBe(false);
    expect(result.feedbackOverride).toBeUndefined();
  });

  it("Advanced: too heavy at the final value keeps the exercise", () => {
    const result = calculateMaxStrengthAdjustment(
      input(
        "TOO_HARD",
        advancedWithLastSet({
          level: "HARD",
          repetitions: 3,
          weightPercentage: 80,
        }),
      ),
    );

    expect(result.levelUp).toBe(false);
    expect(result.levelDown).toBe(false);
  });
});

describe("calculateMaxStrengthAdjustment: floor", () => {
  const atFloor = userExerciseWith([
    { level: "MEDIUM", repetitions: 5, weightPercentage: 65 },
    { level: "EASY", repetitions: 3, weightPercentage: 65 },
    { level: "EASY", repetitions: 3, weightPercentage: 65 },
  ]);

  it("too heavy at the 65% floor switches to the easier exercise", () => {
    const result = calculateMaxStrengthAdjustment(input("TOO_HARD", atFloor));

    expect(result.levelDown).toBe(true);
    expect(result.levelUp).toBe(false);
    expect(result.feedbackOverride).toEqual({ difficulty: null });
  });

  it("too heavy above the floor keeps the exercise", () => {
    const result = calculateMaxStrengthAdjustment(
      input(
        "TOO_HARD",
        userExerciseWith([
          { level: "MEDIUM", repetitions: 5, weightPercentage: 65 },
          { level: "EASY", repetitions: 3, weightPercentage: 65 },
          { level: "EASY", repetitions: 3, weightPercentage: 67.5 },
        ]),
      ),
    );

    expect(result.levelDown).toBe(false);
    expect(result.feedbackOverride).toBeUndefined();
  });

  it("succeeded at the floor keeps the exercise", () => {
    const result = calculateMaxStrengthAdjustment(input("SUCCEEDED", atFloor));

    expect(result.levelDown).toBe(false);
    expect(result.levelUp).toBe(false);
  });
});

describe("calculateMaxStrengthAdjustment: stored entries", () => {
  it("carries maxFRepetitions through unchanged", () => {
    const reps: MaxForceRepetitionsDataType[] = [
      { level: "MEDIUM", repetitions: 5, weightPercentage: 70 },
      { level: "EASY", repetitions: 2, weightPercentage: 72.5 },
      { level: "EASY", repetitions: 2, weightPercentage: 75 },
    ];
    const result = calculateMaxStrengthAdjustment(
      input("SUCCEEDED", userExerciseWith(reps)),
    );

    expect(result.maxFRepetitions).toEqual(reps);
  });

  it("keeps the exercise for an entry stored without its weight percentage", () => {
    const result = calculateMaxStrengthAdjustment(
      input(
        "TOO_EASY",
        userExerciseWith([{ level: "MEDIUM", repetitions: 3 }]),
      ),
    );

    expect(result.levelUp).toBe(false);
    expect(result.levelDown).toBe(false);
  });
});

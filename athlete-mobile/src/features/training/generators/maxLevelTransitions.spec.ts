/**
 * Ground-truth for the MAX rep-difficulty level state machine, asserted by
 * calling `getMaxTrainingReps` directly. This pins the transitions the
 * progression simulator depends on, so if the generator ever changes them this
 * breaks here rather than silently in a golden table. The `TOO_EASY` cycle
 * (EASY to HARD to MEDIUM back to EASY) is intentionally captured as-is: it is
 * the generator's behavior, however surprising, not a simulator artifact.
 */
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { UserType } from "@/schemas/user.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import TrainingGenerator from "./TrainingGenerator";

type Level = MaxForceRepetitionsDataType["level"];

const squat = ((): ExerciseType => {
  const found = (ExercisesData as ExerciseType[]).find((e) => e.id === "26");
  if (!found) throw new Error("Exercise 26 missing from Exercises.json");
  return found;
})();

const user: UserType = {
  userId: "transition-test",
  personalData: { gender: "FEMALE", birthday: "2005-03-06" },
  workoutData: { tags: { LEVEL: ["BEGINNER"] }, maxValues: DEFAULT_MAX_VALUES },
  temporalData: [],
};

const weights = {
  trainingWeights: [70, 72.5, 75],
};

function appliedLevel(
  lastLevel: Level,
  feedback: ExerciseDifficultyType,
): string {
  const userExerciseData: Record<string, UserExerciseDataType> = {
    "26": {
      exerciseId: "26",
      skill: "MAX_KRAFT",
      maxFRepetitions: [{ level: lastLevel, repetitions: 3 }],
      feedback: { difficulty: feedback },
    },
  };
  const reps = new TrainingGenerator().getMaxTrainingReps(
    user,
    weights,
    userExerciseData,
    squat,
    "w",
  );
  return reps.find((r) => r.level !== "WARMUP")!.level;
}

describe("getMaxTrainingReps: MAX level transition table", () => {
  const cases: [Level, ExerciseDifficultyType, string][] = [
    ["EASY", "TOO_EASY", "HARD"],
    ["MEDIUM", "TOO_EASY", "EASY"],
    ["HARD", "TOO_EASY", "MEDIUM"],
    ["EASY", "SUCCEEDED", "MEDIUM"],
    ["MEDIUM", "SUCCEEDED", "HARD"],
    ["HARD", "SUCCEEDED", "EASY"],
    ["EASY", "TOO_HARD", "EASY"],
    ["MEDIUM", "TOO_HARD", "MEDIUM"],
    ["HARD", "TOO_HARD", "HARD"],
  ];

  it.each(cases)(
    "last level %s with feedback %s yields level %s",
    (lastLevel, feedback, expected) => {
      expect(appliedLevel(lastLevel, feedback)).toBe(expected);
    },
  );
});

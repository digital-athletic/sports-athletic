import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { SQUAT_EXERCISE_ID } from "./valueExercise";

/**
 * Builds the stored data of one exercise: exercise "1" trained in SWR2. The
 * overrides replace any field.
 *
 * generateStoredExerciseData({ repetition: 10 })
 * → { exerciseId: "1", skill: "SWR2", repetition: 10 }
 */
export const generateStoredExerciseData = (
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType => ({ exerciseId: "1", skill: "SWR2", ...overrides });

/**
 * Builds the stored data of one exercise with the athlete's feedback, as a
 * set list builder reads it after a finished workout.
 *
 * generateFeedbackExerciseData({ skill: "WU", repetition: 15 }, "TOO_HARD")
 * → { exerciseId: "1", skill: "WU", repetition: 15, feedback: { difficulty: "TOO_HARD" } }
 */
export const generateFeedbackExerciseData = (
  overrides: Partial<UserExerciseDataType> = {},
  difficulty: ExerciseDifficultyType = "SUCCEEDED",
): UserExerciseDataType =>
  generateStoredExerciseData({ feedback: { difficulty }, ...overrides });

/**
 * Keys stored exercise data by exercise ID, as the exercise data map of the
 * athlete holds it.
 *
 * generateExerciseDataRecord(generateStoredExerciseData({ repetition: 10 }))
 * → { "1": { exerciseId: "1", skill: "SWR2", repetition: 10 } }
 */
export const generateExerciseDataRecord = (
  ...entries: UserExerciseDataType[]
): Record<string, UserExerciseDataType> =>
  Object.fromEntries(entries.map((entry) => [entry.exerciseId, entry]));

/**
 * Builds the stored data of the squat in the max strength skill, with the
 * feedback of the last workout.
 *
 * generateSquatExerciseData({ maxFRepetitions: [...] }, "SUCCEEDED")
 * → { "26": { exerciseId: "26", skill: "MAX_STRENGTH", maxFRepetitions: [...], feedback: { difficulty: "SUCCEEDED" } } }
 */
export const generateSquatExerciseData = (
  overrides: Partial<UserExerciseDataType>,
  difficulty: ExerciseDifficultyType,
): Record<string, UserExerciseDataType> =>
  generateExerciseDataRecord(
    generateFeedbackExerciseData(
      { exerciseId: SQUAT_EXERCISE_ID, skill: "MAX_STRENGTH", ...overrides },
      difficulty,
    ),
  );

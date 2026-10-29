import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type {
  ExerciseProgressMapType,
  ExerciseProgressRecordType,
} from "@/features/training/models/ExerciseProgress";
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
  overrides: Partial<ExerciseProgressRecordType> = {},
): ExerciseProgressRecordType => ({
  exerciseId: "1",
  skill: "SWR2",
  ...overrides,
});

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
 * Keys stored exercise records by exercise ID, as the exercise progress of the
 * athlete holds them.
 *
 * generateExerciseProgressMap(generateStoredExerciseData({ repetition: 10 }))
 * → { "1": { exerciseId: "1", skill: "SWR2", repetition: 10 } }
 */
export const generateExerciseProgressMap = (
  ...records: ExerciseProgressRecordType[]
): ExerciseProgressMapType =>
  Object.fromEntries(records.map((record) => [record.exerciseId, record]));

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
): ExerciseProgressMapType =>
  generateExerciseProgressMap(
    generateFeedbackExerciseData(
      { exerciseId: SQUAT_EXERCISE_ID, skill: "MAX_STRENGTH", ...overrides },
      difficulty,
    ),
  );

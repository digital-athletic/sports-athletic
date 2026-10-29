import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import type {
  ExerciseDataMapType,
  ExerciseProgressMapType,
  ExerciseProgressRecordType,
  ExerciseProgressSourceType,
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
 * Keys stored exercise records by skill and exercise ID, as the exercise
 * progress of the athlete holds them. The older record per exercise stays empty.
 *
 * generateExerciseProgressMap(generateStoredExerciseData({ repetition: 10 }))
 * → { exerciseProgress: { SWR2: { "1": { exerciseId: "1", skill: "SWR2", repetition: 10 } } },
 *     exerciseData: {} }
 */
export const generateExerciseProgressMap = (
  ...records: ExerciseProgressRecordType[]
): ExerciseProgressSourceType => {
  const exerciseProgress: ExerciseProgressMapType = {};
  for (const record of records) {
    (exerciseProgress[record.skill] ??= {})[record.exerciseId] = record;
  }
  return { exerciseProgress, exerciseData: {} };
};

/**
 * Keys stored exercise records by exercise ID, as the older record per
 * exercise holds them: one record per exercise, written before the records
 * per skill existed.
 *
 * generateExerciseDataMap(generateStoredExerciseData({ skill: "SA", weight: 40 }))
 * → { "1": { exerciseId: "1", skill: "SA", weight: 40 } }
 */
export const generateExerciseDataMap = (
  ...records: ExerciseProgressRecordType[]
): ExerciseDataMapType =>
  Object.fromEntries(records.map((record) => [record.exerciseId, record]));

/**
 * Builds the stored data of the squat in the max strength skill, with the
 * feedback of the last workout.
 *
 * generateSquatExerciseData({ maxFRepetitions: [...] }, "SUCCEEDED")
 * → { exerciseProgress: { MAX_STRENGTH: { "26": { exerciseId: "26", skill: "MAX_STRENGTH",
 *       maxFRepetitions: [...], feedback: { difficulty: "SUCCEEDED" } } } }, exerciseData: {} }
 */
export const generateSquatExerciseData = (
  overrides: Partial<UserExerciseDataType>,
  difficulty: ExerciseDifficultyType,
): ExerciseProgressSourceType =>
  generateExerciseProgressMap(
    generateFeedbackExerciseData(
      { exerciseId: SQUAT_EXERCISE_ID, skill: "MAX_STRENGTH", ...overrides },
      difficulty,
    ),
  );

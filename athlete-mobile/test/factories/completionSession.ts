import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import type { UserExerciseDataType } from "@/schemas/sync.schema";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import {
  generateExerciseDataMap,
  generateExerciseProgressMap,
  generateStoredExerciseData,
} from "./storedExerciseData";

/** The exercise every completion spec trains, the barbell hip hinge of its mocked catalog. */
export const COMPLETION_EXERCISE_ID = "900";

/**
 * Builds the rows of one exercise in a session, one per set. The overrides
 * replace any field of every row.
 *
 * generateSetRows(2, { repetition: 10 })
 * → [{ exerciseId: "900", skill: "SWR2", set: [1, 2], repetition: 10, ... }, { ..., set: [2, 2], ... }]
 */
export const generateSetRows = (
  setCount: number,
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType[] =>
  Array.from({ length: setCount }, (_unused, index) => ({
    exerciseId: COMPLETION_EXERCISE_ID,
    skill: "SWR2",
    branchId: "-1",
    set: [index + 1, setCount],
    weight: 70,
    weightType: "weightFMax",
    ...overrides,
  }));

/**
 * Prepares an advanced male athlete whose session holds one last set row of
 * exercise 900, and fills the stored exercise data with the given records.
 * Without records, exercise 900 has one SWR2 record rated TOO_EASY.
 *
 * seedCompletionSession({ skill: "SA" }, [])
 * → session exercise 900 under SA, exerciseProgress and exerciseData are {}
 */
export const seedCompletionSession = (
  entry: Partial<UserExerciseDataType>,
  records: UserExerciseDataType[] = [
    generateStoredExerciseData({
      exerciseId: COMPLETION_EXERCISE_ID,
      skill: "SWR2",
      feedback: { difficulty: "TOO_EASY" },
    }),
  ],
) => {
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
  useTrainingStore.setState({
    exerciseList: generateSetRows(1, { set: [3, 3], ...entry }),
    activeTraining: { id: "training-1", type: "PLAN" },
  });
  useUserWorkoutStore.setState({
    workoutData: {
      sport: "OTHER_SPORT",
      tags: { LEVEL: ["ADVANCED"] },
      seasonPhase: { type: null, endDate: "2026-01-01" },
      maxValues: {
        ...DEFAULT_MAX_VALUES,
        hipHinge: { ...DEFAULT_MAX_VALUES.hipHinge, barbell: 121 },
      },
    },
  });
  useUserProfileStore.setState({
    personalData: { username: "test", gender: "MALE", birthday: "1990-01-01" },
  });
  useExerciseProgressStore.getState().resetProgress();
  // As the dual write leaves them: one record per skill, and per exercise the last one.
  useExerciseProgressStore.setState({
    exerciseProgress:
      generateExerciseProgressMap(...records).exerciseProgress ?? {},
    exerciseData: generateExerciseDataMap(...records),
  });
};

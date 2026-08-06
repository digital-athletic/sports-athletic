import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";

/** Shared test fixtures for training feature specs. Not for production code. */

export const createExerciseData = (
  overrides: Partial<ExerciseType> = {},
): ExerciseType => ({
  id: "1",
  level: { m: 1, w: 1 },
  name: "Test Exercise",
  displayName: "Test",
  description: null,
  picture: null,
  video: null,
  values: null,
  tags: [],
  isAdvanceByReps: false,
  isAdvanceByDuration: false,
  isJump: false,
  ...overrides,
});

export const createExercise = (
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType =>
  ({
    exerciseId: "1",
    branchId: "10",
    skill: "SWR",
    ...overrides,
  }) as UserExerciseDataType;

/** Baseline training store data state to reset between tests. */
export const BASELINE_TRAINING_STATE = {
  selection: null,
  exerciseList: null,
  progressBefore: null,
  equipment: [],
  time: {
    start: undefined,
    end: undefined,
    pause: 0,
    skill: {
      PREVENTION: 0,
      MOBILITY: 0,
      SWR: 0,
      WARMUP: 0,
      STABILITY: 0,
      CARDIO: 0,
    },
  },
  activeTraining: null,
  activeExerciseIndex: 0,
  tempMaxValues: null,
  completedExerciseIndices: [],
};

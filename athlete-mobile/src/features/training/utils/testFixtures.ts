import { type TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  type AiwlTrainingType,
  isLegacyTraining,
  type LegacyTrainingType,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";

/** Shared test fixtures for training feature specs. Not for production code. */

/** Narrows a training day of a legacy plan; fails the test for any other. */
export const requireLegacyTraining = (
  training: UserTrainingType | undefined,
): LegacyTrainingType => {
  if (!training || !isLegacyTraining(training)) {
    throw new Error("Expected a training day of a legacy plan");
  }
  return training;
};

/** A training day stored as an AIWL workout of one warm-up branch. */
export const createAiwlTraining = (
  overrides: Partial<AiwlTrainingType> = {},
): AiwlTrainingType => ({
  weekday: 1,
  focus: "PHASE",
  equipment: ["DUMBBELL"],
  workout: {
    aiwl: 1,
    id: "TRAINING_DAY_1",
    name: { en: "Monday" },
    blocks: [
      { kind: "branches", skill: "WU", branches: ["410"], duration: 300 },
    ],
  },
  ...overrides,
});

/** A plan in the AIWL format with one section of the given training days. */
export const createAiwlPlan = (
  trainings: AiwlTrainingType[] = [createAiwlTraining()],
): TrainingPlanType => ({
  start: "2026-10-05",
  format: "aiwl",
  sections: [
    {
      start: "2026-10-05",
      numOfWeeks: 4,
      type: "SK",
      cardioType: "CARDIO_3",
      trainings,
    },
  ],
});

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
  tempMaxValues: null,
};

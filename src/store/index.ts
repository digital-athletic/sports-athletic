/**
 * Zustand Store Exports
 *
 * Phase 1 Global State Management
 *
 * This module exports all Zustand stores for the application.
 * These stores replace the legacy Redux architecture.
 */

// Core Authentication & User Stores
export { useAuthStore } from "./authStore";
export type { AuthState, AuthType } from "./authStore";

export { useUserProfileStore } from "./userProfileStore";
export type {
  UserPersonalDataType,
  UserProfileState,
} from "./userProfileStore";

export { useUserWorkoutStore } from "./userWorkoutStore";
export type {
  ExerciseBranchType,
  MaxValuesType,
  SeasonPhaseType,
  Sport,
  TrainingPlanType,
  UserWorkoutDataType,
  UserWorkoutState,
} from "./userWorkoutStore";

export { useUserSettingsStore } from "./userSettingsStore";
export type { ReviewStatusType, UserSettingsState } from "./userSettingsStore";

// Training & Exercise Stores
export { useTrainingScheduleStore } from "./trainingScheduleStore";
export type {
  TrainingDayType,
  TrainingScheduleState,
} from "./trainingScheduleStore";

export { useExercisesStore } from "./exercisesStore";
export type { ExerciseType, ExercisesState, SkillType } from "./exercisesStore";

export { useSkillTreesStore } from "./skillTreesStore";
export type { SkillTreeType, SkillTreesState } from "./skillTreesStore";

// Progress & History Stores
export { useExerciseProgressStore } from "./exerciseProgressStore";
export type {
  ExerciseFeedback,
  ExerciseProgressState,
  UserExerciseBranchDataType,
  UserExerciseDataType,
} from "./exerciseProgressStore";

export { useCompletedWorkoutsStore } from "./completedWorkoutsStore";
export type {
  CompleteWorkoutType,
  CompletedWorkoutListEntryType,
  CompletedWorkoutsState,
} from "./completedWorkoutsStore";

// Middleware
export { asyncStorage } from "./middleware";

/**
 * Type definitions for E2E mock stores.
 */

import type { StorageKey } from "./constants";

/**
 * Wrapper for Zustand persisted store state.
 */
export interface StoreState<T> {
  state: T;
}

/**
 * Places store state.
 */
export interface PlacesState {
  places: {
    HOME: {
      equipment: string[];
    };
    STUDIO: {
      equipment: string[];
    };
    HALL: {
      equipment: string[];
    };
    OUTSIDE: {
      equipment: string[];
    };
  };
}

/**
 * User profile store state.
 */
export interface UserProfileState {
  userId: string;
  personalData: {
    username: string;
    gender: "MALE" | "FEMALE";
    birthday: string;
    height: number;
    weight: number;
  };
  isInInitialAnamnesis: boolean;
  anamnesisCompleted: boolean;
  teamId: string | null;
}

/**
 * User workout store state.
 */
export interface UserWorkoutState {
  workoutData: {
    sport: string;
    tags: Record<string, string[]>;
    seasonPhase: {
      type: string;
      endDate: string;
      currentWeek: number;
      totalWeeks: number;
    };
    maxValues: unknown;
  };
  trainingPlan: {
    start: string;
    sections: unknown[];
  };
  temporalData: unknown;
}

/**
 * Exercise progress store state.
 */
export interface ExerciseProgressState {
  exerciseData: Record<string, ExerciseData>;
  branchData: Record<string, { level: number }>;
  xp: number;
  level: number;
  testHistory: unknown[];
}

export interface ExerciseData {
  exerciseId: string;
  skill?: string;
  weight?: number;
  repetition?: number;
  weightType?: string;
}

/**
 * Training schedule store state.
 */
export interface TrainingScheduleState {
  trainingDays: {
    active: boolean;
    weekday: number;
    duration: number;
    place: string;
  }[];
}

/**
 * Anamnesis store state.
 */
export interface AnamnesisState {
  values: {
    height: number;
    weight: number;
  };
  tags: Record<string, string[]>;
  originPath: unknown;
  seasonPhase: {
    type: string;
    endDate: string;
  };
}

/**
 * Completed workouts store state.
 */
export interface CompletedWorkoutsState {
  workouts: Record<string, CompletedWorkout>;
}

/**
 * Single completed workout data.
 * Includes pre-calculated totals (xpEarned, movedWeight, exerciseCount, userSkills)
 * to match the production CompleteWorkoutType schema.
 */
export interface CompletedWorkout {
  id: string;
  timestamp: number;
  duration: number;
  xpEarned?: number;
  movedWeight?: number;
  exerciseCount?: number;
  userSkills?: Record<string, number>;
  exercises: {
    exerciseId: string;
    skill?: string;
    weight?: number;
    repetition?: number;
    set?: [number, number];
  }[];
}

/**
 * Map of storage keys to their store states.
 */
export type StoreDataMap = Partial<{
  [K in StorageKey]: StoreState<unknown>;
}>;

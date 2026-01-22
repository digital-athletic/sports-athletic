import { SharedConstants } from "@/constants/sharedConstants";
import { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface CompleteWorkoutType {
  id: string;
  timestamp: number;
  exercises: UserExerciseDataType[];
  duration: number;
  xpEarned?: number;
}

export interface CompletedWorkoutListEntryType {
  id: string;
  timestamp: number;
  summary: string;
}

type State = {
  workouts: Record<string, CompleteWorkoutType>;
  workoutsList: CompletedWorkoutListEntryType[];
  trainingPlans: TrainingPlanType[];
};

const DEFAULT_STATE: State = {
  workouts: {},
  workoutsList: [],
  trainingPlans: [],
};

type Actions = {
  addCompletedWorkout: (workout: CompleteWorkoutType) => void;
  setCompletedWorkouts: (workouts: Record<string, CompleteWorkoutType>) => void;
  setWorkoutsList: (list: CompletedWorkoutListEntryType[]) => void;
  addCompletedTrainingPlan: (plan: TrainingPlanType) => void;
  setCompletedTrainingPlans: (plans: TrainingPlanType[]) => void;
  clearHistory: () => void;
};

type Selectors = {
  getWorkoutById: (id: string) => CompleteWorkoutType | undefined;
  getRecentWorkouts: (limit: number) => CompleteWorkoutType[];
  getTotalWorkouts: () => number;
  getTotalTrainingTime: () => number;
};

export type CompletedWorkoutsState = State & Actions & Selectors;

/**
 * Completed Workouts Store
 *
 * Manages workout history and completed training plans.
 * Used for statistics, progress visualization, and user engagement tracking.
 *
 * Note: Consider pagination/lazy loading for large histories in the future.
 *
 * @example
 * ```tsx
 * const { addCompletedWorkout, getRecentWorkouts, getTotalWorkouts } = useCompletedWorkoutsStore();
 *
 * // Add a completed workout
 * addCompletedWorkout({
 *   id: 'workout-123',
 *   timestamp: Date.now(),
 *   exercises: [...],
 *   duration: 3600, // seconds
 *   xpEarned: 150,
 * });
 *
 * // Get last 10 workouts
 * const recent = getRecentWorkouts(10);
 *
 * // Get total workouts count
 * const total = getTotalWorkouts();
 * ```
 */
export const useCompletedWorkoutsStore = create<CompletedWorkoutsState>()(
  persist(
    immer((set, get) => ({
      ...DEFAULT_STATE,

      addCompletedWorkout: (workout) =>
        set((state) => {
          state.workouts[workout.id] = workout;
          state.workoutsList.push({
            id: workout.id,
            timestamp: workout.timestamp,
            summary: `Workout completed in ${Math.floor(workout.duration / 60)} minutes`,
          });
        }),

      setCompletedWorkouts: (workouts) =>
        set((state) => {
          state.workouts = workouts;
        }),

      setWorkoutsList: (list) =>
        set((state) => {
          state.workoutsList = list;
        }),

      addCompletedTrainingPlan: (plan) =>
        set((state) => {
          state.trainingPlans.push(plan);
        }),

      setCompletedTrainingPlans: (plans) =>
        set((state) => {
          state.trainingPlans = plans;
        }),

      clearHistory: () =>
        set((state) => {
          state.workouts = {};
          state.workoutsList = [];
          state.trainingPlans = [];
        }),

      getWorkoutById: (id) => {
        const { workouts } = get();
        return workouts[id];
      },

      getRecentWorkouts: (limit) => {
        const { workoutsList, workouts } = get();
        const sorted = [...workoutsList].sort(
          (a, b) => b.timestamp - a.timestamp,
        );
        const recent = sorted.slice(0, limit);
        return recent
          .map((entry) => workouts[entry.id])
          .filter(
            (workout): workout is CompleteWorkoutType => workout !== undefined,
          );
      },

      getTotalWorkouts: () => {
        const { workoutsList } = get();
        return workoutsList.length;
      },

      getTotalTrainingTime: () => {
        const { workouts } = get();
        return Object.values(workouts).reduce(
          (total, workout) => total + workout.duration,
          0,
        );
      },
    })),
    {
      name: "completed-workouts-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? DEFAULT_STATE
          : persistedState,
    },
  ),
);

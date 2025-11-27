import { ExerciseType } from "@/features/training/models/Exercise";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface ExercisesState {
  exercises: ExerciseType[] | null;

  // Actions
  setExercises: (exercises: ExerciseType[]) => void;
  clearExercises: () => void;

  // Selectors
  getExerciseById: (id: number) => ExerciseType | undefined;
  getExercisesByTag: (tag: string) => ExerciseType[];
}

/**
 * Exercises Store
 *
 * Manages the exercise database.
 * Central repository for all exercise definitions used throughout the app.
 *
 * Note: Consider migrating to React Query for server-side fetching in the future.
 *
 * @example
 * ```tsx
 * const { exercises, getExerciseById } = useExercisesStore();
 *
 * // Get a specific exercise
 * const exercise = getExerciseById(42);
 *
 * ```
 */
export const useExercisesStore = create<ExercisesState>()(
  persist(
    immer((set, get) => ({
      exercises: null,

      setExercises: (exercises) =>
        set((state) => {
          state.exercises = exercises;
        }),

      clearExercises: () =>
        set((state) => {
          state.exercises = null;
        }),

      getExerciseById: (id) => {
        const { exercises } = get();
        return exercises?.find((exercise) => exercise.id === id);
      },

      getExercisesByTag: (tag) => {
        const { exercises } = get();
        return (
          exercises?.filter((exercise) => exercise.tags.includes(tag)) ?? []
        );
      },
    })),
    {
      name: "exercises-storage",
      storage: asyncStorage,
    }
  )
);

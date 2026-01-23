import { SharedConstants } from "@/constants/sharedConstants";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

type State = {
  exercises: ExerciseType[] | null;
};

const DEFAULT_STATE: State = {
  exercises: null,
};

type Actions = {
  setExercises: (exercises: ExerciseType[]) => void;
  clearExercises: () => void;
};

type Selectors = {
  getExerciseById: (id: string) => ExerciseType | undefined;
  getExercisesByTag: (tag: string) => ExerciseType[];
};

export type ExercisesState = State & Actions & Selectors;

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
export const selectExercises = (state: ExercisesState) => state.exercises;
export const selectSetExercises = (state: ExercisesState) => state.setExercises;

export const useExercisesStore = create<ExercisesState>()(
  persist(
    immer((set, get) => ({
      ...DEFAULT_STATE,

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
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? DEFAULT_STATE
          : persistedState,
    },
  ),
);

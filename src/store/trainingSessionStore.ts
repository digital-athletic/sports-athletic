import { create } from "zustand";

/**
 * Training session state (example of ephemeral state)
 */
export interface TrainingSessionState {
  // State
  isActive: boolean;
  startTime: number | null;
  currentExerciseId: string | null;
  completedExercises: string[];

  // Actions
  startSession: () => void;
  endSession: () => void;
  setCurrentExercise: (exerciseId: string) => void;
  completeExercise: (exerciseId: string) => void;
  resetSession: () => void;
}

/**
 * Initial state for training session
 */
const initialState = {
  isActive: false,
  startTime: null,
  currentExerciseId: null,
  completedExercises: [],
};

/**
 * Training session store (non-persisted)
 *
 * This store demonstrates:
 * - Ephemeral state that shouldn't persist between app launches
 * - Time-based state management
 * - Array manipulation in actions
 *
 * @example
 * ```typescript
 * const { startSession, isActive } = useTrainingSessionStore();
 * startSession();
 * ```
 */
export const useTrainingSessionStore = create<TrainingSessionState>((set) => ({
  ...initialState,

  startSession: () =>
    set({
      isActive: true,
      startTime: Date.now(),
      completedExercises: [],
    }),

  endSession: () =>
    set({
      isActive: false,
      startTime: null,
      currentExerciseId: null,
    }),

  setCurrentExercise: (exerciseId) => set({ currentExerciseId: exerciseId }),

  completeExercise: (exerciseId) =>
    set((state) => ({
      completedExercises: [...state.completedExercises, exerciseId],
      currentExerciseId: null,
    })),

  resetSession: () => set(initialState),
}));

/**
 * Selectors for derived state
 * Use these to compute values based on store state
 */
export const trainingSessionSelectors = {
  sessionDuration: (state: TrainingSessionState): number | null => {
    if (!state.isActive || !state.startTime) return null;
    return Date.now() - state.startTime;
  },

  exerciseCount: (state: TrainingSessionState): number => {
    return state.completedExercises.length;
  },

  hasActiveExercise: (state: TrainingSessionState): boolean => {
    return state.currentExerciseId !== null;
  },
};

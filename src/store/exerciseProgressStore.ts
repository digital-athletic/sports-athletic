import { create } from "zustand";
import { persist } from "zustand/middleware";
import { asyncStorage } from "./middleware";
import type { MaxValuesType } from "./userWorkoutStore";

export type ExerciseFeedback = "EASY" | "NORMAL" | "HARD";

export interface UserExerciseDataType {
  exerciseId: number;
  feedback?: ExerciseFeedback;
  streakCounter?: number;
  weight?: number;
  nextWeightPercentage?: number;
  duration?: number;
  reps?: number;
  height?: number;
  skipped?: boolean;
}

export interface UserExerciseBranchDataType {
  branchId: number;
  level: number;
}

export interface ExerciseProgressState {
  // Exercise-level data
  exerciseData: Record<number, UserExerciseDataType>;
  branchData: Record<number, UserExerciseBranchDataType>;

  // User progression
  xp: number;
  level: number;
  testHistory: MaxValuesType[];

  // Actions - Exercise Data
  setExerciseData: (data: Record<number, UserExerciseDataType>) => void;
  updateExercise: (
    exerciseId: number,
    data: Partial<UserExerciseDataType>
  ) => void;
  setBranchLevel: (branchId: number, level: number) => void;

  // Actions - User Progress
  addXP: (amount: number) => void;
  setLevel: (level: number) => void;
  addTestResult: (result: MaxValuesType) => void;
  clearProgress: () => void;

  // Selectors
  getExerciseData: (exerciseId: number) => UserExerciseDataType | undefined;
  getBranchLevel: (branchId: number) => number;
  getLatestTestResult: () => MaxValuesType | undefined;
}

/**
 * Exercise Progress Store
 *
 * Combines the legacy Redux `progress` and `exerciseData` branches.
 * Manages user progression, exercise performance data, and gamification.
 *
 * @example
 * ```tsx
 * const { xp, level, addXP, updateExercise, getBranchLevel } = useExerciseProgressStore();
 *
 * // Add XP after workout completion
 * addXP(150);
 *
 * // Update exercise feedback
 * updateExercise(42, { feedback: 'HARD', weight: 20 });
 *
 * // Check branch progression level
 * const currentLevel = getBranchLevel(5);
 *
 * // Save test results
 * addTestResult({ squat: 100, pushup: 30 });
 * ```
 */
export const useExerciseProgressStore = create<ExerciseProgressState>()(
  persist(
    (set, get) => ({
      exerciseData: {},
      branchData: {},
      xp: 0,
      level: 1,
      testHistory: [],

      setExerciseData: (data) => set({ exerciseData: data }),

      updateExercise: (exerciseId, data) =>
        set((state) => ({
          exerciseData: {
            ...state.exerciseData,
            [exerciseId]: {
              ...state.exerciseData[exerciseId],
              exerciseId,
              ...data,
            },
          },
        })),

      setBranchLevel: (branchId, level) =>
        set((state) => ({
          branchData: {
            ...state.branchData,
            [branchId]: { branchId, level },
          },
        })),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.xp + amount;
          // Simple level calculation: level = floor(xp / 1000) + 1
          const newLevel = Math.floor(newXP / 1000) + 1;
          return { xp: newXP, level: newLevel };
        }),

      setLevel: (level) => set({ level }),

      addTestResult: (result) =>
        set((state) => ({
          testHistory: [...state.testHistory, result],
        })),

      clearProgress: () =>
        set({
          exerciseData: {},
          branchData: {},
          xp: 0,
          level: 1,
          testHistory: [],
        }),

      getExerciseData: (exerciseId) => {
        const { exerciseData } = get();
        return exerciseData[exerciseId];
      },

      getBranchLevel: (branchId) => {
        const { branchData } = get();
        return branchData[branchId]?.level ?? 0;
      },

      getLatestTestResult: () => {
        const { testHistory } = get();
        return testHistory[testHistory.length - 1];
      },
    }),
    {
      name: "exercise-progress-storage",
      storage: asyncStorage,
    }
  )
);

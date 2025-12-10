import { MaxValuesType } from "@/features/training/models/MaxValues";
import { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

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
    data: Partial<UserExerciseDataType>,
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
    immer((set, get) => ({
      exerciseData: {},
      branchData: {},
      xp: 0,
      level: 1,
      testHistory: [],

      setExerciseData: (data) =>
        set((state) => {
          state.exerciseData = data;
        }),

      updateExercise: (exerciseId, data) =>
        set((state) => {
          const existing = state.exerciseData[exerciseId];
          if (!existing) {
            // When creating new exercise, data must include required fields
            state.exerciseData[exerciseId] = {
              ...data,
              exerciseId,
              feedback: data.feedback || { difficulty: null },
              skill: data.skill || "WARMUP",
            };
          } else {
            // Merge with existing data while preserving required fields
            state.exerciseData[exerciseId] = {
              ...existing,
              ...data,
            };
          }
        }),

      setBranchLevel: (branchId, level) =>
        set((state) => {
          state.branchData[branchId] = { branchId, level };
        }),

      addXP: (amount) =>
        set((state) => {
          state.xp += amount;
          state.level = Math.floor(state.xp / 1000) + 1;
        }),

      setLevel: (level) =>
        set((state) => {
          state.level = level;
        }),

      addTestResult: (result) =>
        set((state) => {
          state.testHistory.push(result);
        }),

      clearProgress: () =>
        set((state) => {
          state.exerciseData = {};
          state.branchData = {};
          state.xp = 0;
          state.level = 1;
          state.testHistory = [];
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
    })),
    {
      name: "exercise-progress-storage",
      storage: asyncStorage,
    },
  ),
);

import { MaxValuesType } from "@/features/training/models/MaxValues";
import { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface UserExerciseBranchDataType {
  branchId: string;
  level: number;
}

export type BranchDataMapType = Record<
  string,
  UserExerciseBranchDataType | undefined
>;

export interface ExerciseProgressState {
  // Exercise-level data
  exerciseData: Record<string, UserExerciseDataType | undefined>;
  branchData: BranchDataMapType;

  // User progression
  xp: number;
  level: number;
  testHistory: MaxValuesType[];

  // Actions - Exercise Data
  setExerciseData: (data: Record<string, UserExerciseDataType>) => void;
  updateExercise: (exerciseId: string, data: UserExerciseDataType) => void;
  setBranchLevel: (branchId: string, level: number) => void;

  // Actions - User Progress
  addXP: (amount: number) => void;
  setLevel: (level: number) => void;
  addTestResult: (result: MaxValuesType) => void;
  clearProgress: () => void;

  // Selectors
  getExerciseData: (exerciseId: string) => UserExerciseDataType | undefined;
  getBranchLevel: (branchId: string) => number;
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
            const update: UserExerciseDataType = {
              exerciseId,
              skill: data.skill,
            };

            if (data.feedback) {
              update.feedback = {
                difficulty: data.feedback.difficulty || null,
                streakCounter: 1,
              };
            }
            if (typeof data.height === "number") {
              update.height = data.height;
            }
            if (data.maxFLevelAdjustment) {
              update.maxFLevelAdjustment = data.maxFLevelAdjustment;
            }
            if (data.maxFRepetitions) {
              update.maxFRepetitions = data.maxFRepetitions;
            }
            if (typeof data.nextWeightPercentage === "number") {
              update.nextWeightPercentage = data.nextWeightPercentage;
            }
            if (typeof data.repetition === "number") {
              update.repetition = data.repetition;
            }
            if (data.set) {
              update.set = data.set;
            }
            if (typeof data.skipped === "boolean") {
              update.skipped = data.skipped;
            }
            if (typeof data.weight === "number") {
              update.weight = data.weight;
            }
            if (typeof data.weightType === "string") {
              update.weightType = data.weightType;
            }

            state.exerciseData[exerciseId] = update;
            return;
          }

          if (data.feedback) {
            const prevDifficulty = existing.feedback?.difficulty;

            // Handle streak counter
            if (prevDifficulty && prevDifficulty === data.feedback.difficulty) {
              existing.feedback = {
                difficulty: data.feedback.difficulty,
                streakCounter: (existing.feedback?.streakCounter ?? 0) + 1,
              };
            } else {
              existing.feedback = {
                difficulty: data.feedback.difficulty,
                streakCounter: 1,
              };
            }
          }
          if (typeof data.height === "number") {
            existing.height = data.height;
          }
          if (data.maxFLevelAdjustment) {
            existing.maxFLevelAdjustment = data.maxFLevelAdjustment;
          }
          if (data.maxFRepetitions) {
            existing.maxFRepetitions = data.maxFRepetitions;
          }
          if (typeof data.nextWeightPercentage === "number") {
            existing.nextWeightPercentage = data.nextWeightPercentage;
          }
          if (typeof data.repetition === "number") {
            existing.repetition = data.repetition;
          }
          if (data.set) {
            existing.set = data.set;
          }
          if (typeof data.skipped === "boolean") {
            existing.skipped = data.skipped;
          }
          if (typeof data.weight === "number") {
            existing.weight = data.weight;
          }
          if (typeof data.weightType === "string") {
            existing.weightType = data.weightType;
          }
        }),

      setBranchLevel: (branchId, level) =>
        set((state) => {
          const branch = state.branchData[branchId];
          if (branch) {
            branch.level = level;
          } else {
            state.branchData[branchId] = { branchId, level };
          }
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

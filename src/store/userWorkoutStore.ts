import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

// Type definitions based on legacy models
export type Sport = string; // e.g., 'SOCCER', 'BASKETBALL', etc.

export interface SeasonPhaseType {
  type: string;
  endDate?: string;
}

export interface MaxValuesType {
  [key: string]: number;
}

export interface ExerciseBranchType {
  id: number;
  exercises: number[];
  level: number;
}

export interface TrainingPlanType {
  sections: {
    weekday: number;
    trainings: {
      skill: string;
      branches: ExerciseBranchType[];
    }[];
  }[];
}

export interface UserWorkoutDataType {
  sport: Sport;
  seasonPhase: SeasonPhaseType;
  equipment: string[];
  maxValues: MaxValuesType;
  tags: string[];
}

export interface UserWorkoutState {
  workoutData: UserWorkoutDataType;
  trainingPlan: TrainingPlanType | null;

  // Actions
  setWorkoutData: (data: Partial<UserWorkoutDataType>) => void;
  setSport: (sport: Sport) => void;
  setSeasonPhase: (phase: SeasonPhaseType) => void;
  setEquipment: (equipment: string[]) => void;
  setTags: (tags: string[]) => void;
  setTrainingPlan: (plan: TrainingPlanType | null) => void;
  replaceBranchInTrainingPlan: (
    sectionIndex: number,
    weekday: number,
    skillId: string,
    branchIdToReplace: number,
    branchesToFillIn: ExerciseBranchType[]
  ) => void;
  saveMaxValues: (maxValues: MaxValuesType) => void;
}

const DEFAULT_WORKOUT_DATA: UserWorkoutDataType = {
  sport: "",
  seasonPhase: { type: "" },
  equipment: [],
  maxValues: {},
  tags: [],
};

/**
 * User Workout Store
 *
 * Manages workout configuration, training plan, and sport-specific settings.
 * This store handles all data needed for training plan generation and exercise personalization.
 *
 * @example
 * ```tsx
 * const { workoutData, setSport, setTrainingPlan, replaceBranchInTrainingPlan } = useUserWorkoutStore();
 *
 * // Set user's sport
 * setSport('SOCCER');
 *
 * // Update season phase
 * setSeasonPhase({ type: 'COMPETITION', endDate: '2025-12-31' });
 *
 * // Replace a branch in training plan (complex operation from legacy)
 * replaceBranchInTrainingPlan(0, 1, 'PREVENTION', 5, newBranches);
 * ```
 */
export const useUserWorkoutStore = create<UserWorkoutState>()(
  persist(
    immer((set, get) => ({
      workoutData: DEFAULT_WORKOUT_DATA,
      trainingPlan: null,

      setWorkoutData: (data) =>
        set((state) => {
          state.workoutData = { ...state.workoutData, ...data };
        }),

      setSport: (sport) =>
        set((state) => {
          state.workoutData.sport = sport;
        }),

      setSeasonPhase: (phase) =>
        set((state) => {
          state.workoutData.seasonPhase = phase;
        }),

      setEquipment: (equipment) =>
        set((state) => {
          state.workoutData.equipment = equipment;
        }),

      setTags: (tags) =>
        set((state) => {
          state.workoutData.tags = tags;
        }),

      setTrainingPlan: (plan) =>
        set((state) => {
          state.trainingPlan = plan;
        }),

      saveMaxValues: (maxValues) =>
        set((state) => {
          state.workoutData.maxValues = maxValues;
        }),

      /**
       * Replace a branch in the training plan
       * This is a complex operation from the legacy Redux reducer
       * Preserves the exact logic for updating nested training plan structure
       */
      replaceBranchInTrainingPlan: (
        sectionIndex,
        weekday,
        skillId,
        branchIdToReplace,
        branchesToFillIn
      ) =>
        set((state) => {
          if (!state.trainingPlan?.sections) return;

          // Find the section for the given weekday
          const section = state.trainingPlan.sections.find(
            (s) => s.weekday === weekday
          );
          if (!section?.trainings) return;

          // Find the training for the given skill
          const training = section.trainings[sectionIndex];
          if (!training || training.skill !== skillId) return;

          // Find the branch to replace
          const branchIndex = training.branches.findIndex(
            (b) => b.id === branchIdToReplace
          );
          if (branchIndex === -1) return;

          // Replace the branch with new branches (immer handles immutability)
          training.branches.splice(branchIndex, 1, ...branchesToFillIn);
        }),
    })),
    {
      name: "user-workout-storage",
      storage: asyncStorage,
    }
  )
);

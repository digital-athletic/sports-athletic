import { create } from "zustand";
import { persist } from "zustand/middleware";
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
    (set, get) => ({
      workoutData: DEFAULT_WORKOUT_DATA,
      trainingPlan: null,

      setWorkoutData: (data) =>
        set((state) => ({
          workoutData: { ...state.workoutData, ...data },
        })),

      setSport: (sport) =>
        set((state) => ({
          workoutData: { ...state.workoutData, sport },
        })),

      setSeasonPhase: (phase) =>
        set((state) => ({
          workoutData: { ...state.workoutData, seasonPhase: phase },
        })),

      setEquipment: (equipment) =>
        set((state) => ({
          workoutData: { ...state.workoutData, equipment },
        })),

      setTags: (tags) =>
        set((state) => ({
          workoutData: { ...state.workoutData, tags },
        })),

      setTrainingPlan: (plan) => set({ trainingPlan: plan }),

      saveMaxValues: (maxValues) =>
        set((state) => ({
          workoutData: { ...state.workoutData, maxValues },
        })),

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
          const { trainingPlan } = state;
          if (!trainingPlan?.sections) return state;

          // Deep clone the training plan to avoid mutation
          const newPlan = JSON.parse(
            JSON.stringify(trainingPlan)
          ) as TrainingPlanType;

          // Find the section for the given weekday
          const section = newPlan.sections.find((s) => s.weekday === weekday);
          if (!section?.trainings) return state;

          // Find the training for the given skill
          const training = section.trainings[sectionIndex];
          if (!training || training.skill !== skillId) return state;

          // Find the branch to replace
          const branchIndex = training.branches.findIndex(
            (b) => b.id === branchIdToReplace
          );
          if (branchIndex === -1) return state;

          // Replace the branch with new branches
          training.branches.splice(branchIndex, 1, ...branchesToFillIn);

          return { trainingPlan: newPlan };
        }),
    }),
    {
      name: "user-workout-storage",
      storage: asyncStorage,
    }
  )
);

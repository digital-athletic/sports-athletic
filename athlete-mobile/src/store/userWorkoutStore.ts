import { SharedConstants } from "@/constants/sharedConstants";
import { isSkillTypes } from "@/constants/workoutConstants";
import { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import {
  DEFAULT_MAX_VALUES,
  MaxValuesType,
} from "@/features/training/models/MaxValues";
import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { TemporalDataType } from "@/features/training/models/TemporalData";
import { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  Sport,
  UserWorkoutDataType,
} from "@/features/training/models/UserWorkoutData";
import {
  enrichSeasonPhaseWithWeeks,
  enrichSeasonPhaseWithWeeksFromDate,
} from "@/features/training/utils/seasonPhaseUtils";
import { dateToDDMMYYYY } from "@/utils/date";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

type State = {
  workoutData: UserWorkoutDataType;
  trainingPlan: TrainingPlanType | null;
  temporalData?: TemporalDataType[];
};

const createInitialWorkoutData = (): UserWorkoutDataType => ({
  anamnesisCompleted: false,
  gender: "MALE",
  birthday: "01-01-2000",
  weight: 65,
  height: 175,
  sport: "OTHER_SPORT",
  tags: ["POSITION_FIELD", "LEVEL_BEGINNER"],
  seasonPhase: {
    type: null,
    endDate: dateToDDMMYYYY(new Date()),
  },
  maxValues: { ...DEFAULT_MAX_VALUES },
});

const createInitialState = (): State => ({
  workoutData: createInitialWorkoutData(),
  trainingPlan: null,
  temporalData: undefined,
});

type Actions = {
  setWorkoutData: (data: Partial<UserWorkoutDataType>) => void;
  setSport: (sport: Sport) => void;
  setSeasonPhase: (phase: SeasonPhaseType, startDate?: Date) => void;
  setTags: (tags: string[]) => void;
  setTrainingPlan: (plan: TrainingPlanType | null) => void;
  setTemporalData: (data: TemporalDataType[]) => void;
  clearUserWorkoutData: () => void;
  replaceBranchInTrainingPlan: (
    sectionIndex: number,
    weekday: number,
    skillId: string,
    branchIdToReplace: string,
    branchesToFillIn: ExerciseBranchType[],
  ) => void;
  saveMaxValues: (maxValues: MaxValuesType) => void;
};

export type UserWorkoutState = State & Actions;

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
    immer((set) => ({
      ...createInitialState(),

      setWorkoutData: (data) =>
        set((state) => {
          state.workoutData = { ...state.workoutData, ...data };
        }),

      setSport: (sport) =>
        set((state) => {
          state.workoutData.sport = sport;
        }),

      setSeasonPhase: (phase, startDate) =>
        set((state) => {
          state.workoutData.seasonPhase = startDate
            ? enrichSeasonPhaseWithWeeksFromDate(phase, startDate)
            : enrichSeasonPhaseWithWeeks(phase);
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

      setTemporalData: (data) =>
        set((state) => {
          state.temporalData = data;
        }),

      clearUserWorkoutData: () =>
        set((state) => {
          const initialState = createInitialState();
          state.workoutData = initialState.workoutData;
          state.trainingPlan = initialState.trainingPlan;
          state.temporalData = initialState.temporalData;
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
        branchesToFillIn,
      ) =>
        set((state) => {
          let plan = state.trainingPlan;

          if (!plan) return;

          const sections = plan.sections;
          if (sectionIndex > sections.length - 1) return;

          // Find the section for the given weekday
          let trainings = sections[sectionIndex]?.trainings;

          if (!trainings) return;

          const training = trainings.find((t) => t.weekday === weekday);

          if (isSkillTypes(skillId)) {
            // Find the branch to replace
            const skillBranches = training?.skills[skillId];
            const branchIndex = skillBranches?.findIndex(
              (branch) => branch.exerciseBranchId === branchIdToReplace,
            );

            // Find the training for the given skill
            if (
              !training ||
              !skillBranches ||
              typeof branchIndex !== "number" ||
              branchIndex === -1
            )
              return;

            // Replace the branch with new branches (immer handles immutability)
            skillBranches.splice(branchIndex, 1, ...branchesToFillIn);
          }
        }),
    })),
    {
      name: "user-workout-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);

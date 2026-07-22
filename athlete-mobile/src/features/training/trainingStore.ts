import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import { asyncStorage } from "@/store/middleware";
import { createMigrate } from "@/store/migrations/createMigrate";
import { trainingStoreMigrations } from "@/store/migrations/trainingStoreMigrations";
import { STORE_VERSIONS } from "@/store/storeVersions";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ActiveTrainingType } from "./models/ActiveTraining";
import { type MaxValuesType } from "./models/MaxValues";
import type { FocusArea } from "./models/Training";
import { TrainingSelectionType, TrainingTimeType } from "./models/Training";
import { UserExerciseDataType } from "./models/UserExerciseData";
import { UserProgressType } from "./models/UserProgress";

export type TrainingViewMode = "SEQUENTIAL" | "LIST";

export type State = {
  selection: TrainingSelectionType | null;
  exerciseList: UserExerciseDataType[] | null;
  progressBefore: UserProgressType | null;
  equipment: string[];
  time: TrainingTimeType;
  activeTraining: ActiveTrainingType | null;
  activeExerciseIndex: number;
  tempMaxValues: MaxValuesType | null;
  _hasHydrated: boolean;
  trainingViewMode: TrainingViewMode | null;
  completedExerciseIndices: number[];
};

const createInitialTrainingTime = (): TrainingTimeType => ({
  start: undefined,
  end: undefined,
  pause: 0,
  skill: {
    PREVENTION: 0,
    MOBILITY: 0,
    SWR: 0,
    WARMUP: 0,
    STABILITY: 0,
    CARDIO: 0,
  },
});

const createInitialState = (): State => ({
  selection: null,
  exerciseList: null,
  progressBefore: null,
  equipment: [],
  time: createInitialTrainingTime(),
  activeTraining: null,
  activeExerciseIndex: 0,
  tempMaxValues: null,
  _hasHydrated: false,
  trainingViewMode: null,
  completedExerciseIndices: [],
});

type Actions = {
  setTrainingSelection: (selection: TrainingSelectionType | null) => void;
  setExerciseList: (list: UserExerciseDataType[] | null) => void;
  setExerciseFeedback: (
    exerciseId: string,
    feedback: ExerciseDifficultyType,
  ) => void;
  setExerciseSkipped: (exerciseId: string) => void;
  updateExerciseProgress: (
    exerciseId: string,
    weight?: number,
    weightPercentage?: number,
    duration?: number,
    repetition?: number,
    height?: number,
  ) => void;
  setProgressBefore: (progress: UserProgressType | null) => void;
  setEquipment: (equipment: string[]) => void;
  setActiveTraining: (training: ActiveTrainingType | null) => void;
  setActiveExerciseIndex: (index: number) => void;
  setTempMaxValues: (values: MaxValuesType | null) => void;
  setTrainingStartTime: (time: number) => void;
  setTrainingEndTime: (time: number) => void;
  addPauseTime: (pauseTime: number) => void;
  addSkillTime: (focusArea: FocusArea, skillTime: number) => void;
  clearTraining: () => void;
  setHasHydrated: (hydrated: boolean) => void;
  setTrainingViewMode: (mode: TrainingViewMode | null) => void;
  markExerciseCompleted: (index: number) => void;
};

export type TrainingState = State & Actions;

const migrateRegistered = createMigrate<State>(
  STORE_VERSIONS.TRAINING,
  trainingStoreMigrations,
  createInitialState,
  "training",
);

// This store persisted valid data at raw version 0 before it was registered
// in storeVersions.ts. The shared createMigrate resets anything below the
// legacy v13, so version 0 is bridged to 14 to preserve existing user data.
export const migrateTrainingStore = (
  persistedState: unknown,
  persistedVersion: number,
): State =>
  migrateRegistered(
    persistedState,
    persistedVersion === 0 ? 14 : persistedVersion,
  );

export const useTrainingStore = create<TrainingState>()(
  persist(
    immer((set) => ({
      ...createInitialState(),

      setTrainingSelection: (selection) =>
        set((state) => {
          state.selection = selection;
        }),
      setExerciseList: (list) =>
        set((state) => {
          state.exerciseList = list;
        }),
      setExerciseFeedback: (exerciseId, feedback) =>
        set((state) => {
          const exercise = state.exerciseList?.findLast(
            (item) => item.exerciseId === exerciseId,
          );
          if (exercise) {
            if (exercise.feedback) {
              exercise.feedback.difficulty = feedback;
            } else {
              exercise.feedback = { difficulty: feedback };
            }
          }
        }),
      setExerciseSkipped: (exerciseId) =>
        set((state) => {
          const exercise = state.exerciseList?.find(
            (item) => item.exerciseId === exerciseId,
          );
          if (exercise) {
            exercise.skipped = true;
          }
        }),
      updateExerciseProgress: (
        exerciseId,
        weight,
        weightPercentage,
        duration,
        repetition,
        height,
      ) =>
        set((state) => {
          const exercise = state.exerciseList?.find(
            (item) => item.exerciseId === exerciseId,
          );

          if (exercise) {
            if (weight !== undefined) exercise.weight = weight;
            if (weightPercentage !== undefined)
              exercise.nextWeightPercentage = weightPercentage;
            if (duration !== undefined) exercise.duration = duration;
            if (repetition !== undefined) exercise.repetition = repetition;
            if (height !== undefined) exercise.height = height;
          }
        }),
      setProgressBefore: (progress) =>
        set((state) => {
          state.progressBefore = progress;
        }),
      setEquipment: (equipment) =>
        set((state) => {
          state.equipment = equipment;
        }),
      setActiveTraining: (training) =>
        set((state) => {
          state.activeTraining = training;
        }),
      setActiveExerciseIndex: (index) =>
        set((state) => {
          state.activeExerciseIndex = index;
        }),
      setTempMaxValues: (values) =>
        set((state) => {
          state.tempMaxValues = values;
        }),
      setTrainingStartTime: (time) =>
        set((state) => {
          state.time.start = time;
        }),
      setTrainingEndTime: (time) =>
        set((state) => {
          state.time.end = time;
        }),
      addPauseTime: (pauseTime) =>
        set((state) => {
          state.time.pause += pauseTime;
        }),
      addSkillTime: (focusArea, skillTime) =>
        set((state) => {
          state.time.skill[focusArea] += skillTime;
        }),
      clearTraining: () =>
        set((state) => {
          const initialState = createInitialState();
          state.exerciseList = initialState.exerciseList;
          state.progressBefore = initialState.progressBefore;
          state.equipment = initialState.equipment;
          state.time = initialState.time;
          state.activeTraining = initialState.activeTraining;
          state.activeExerciseIndex = initialState.activeExerciseIndex;
          state.tempMaxValues = initialState.tempMaxValues;
          state.trainingViewMode = initialState.trainingViewMode;
          state.completedExerciseIndices = initialState.completedExerciseIndices;
        }),
      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),
      setTrainingViewMode: (mode) =>
        set((state) => {
          state.trainingViewMode = mode;
        }),
      markExerciseCompleted: (index) =>
        set((state) => {
          if (!state.completedExerciseIndices.includes(index)) {
            state.completedExerciseIndices.push(index);
          }
        }),
    })),
    {
      name: "training-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.TRAINING,
      migrate: migrateTrainingStore,
      partialize: (state) => ({
        selection: state.selection,
        exerciseList: state.exerciseList,
        progressBefore: state.progressBefore,
        equipment: state.equipment,
        time: state.time,
        activeTraining: state.activeTraining,
        activeExerciseIndex: state.activeExerciseIndex,
        tempMaxValues: state.tempMaxValues,
        trainingViewMode: state.trainingViewMode,
        completedExerciseIndices: state.completedExerciseIndices,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating training store:", error);
        }
        useTrainingStore.getState().setHasHydrated(true);
      },
    },
  ),
);

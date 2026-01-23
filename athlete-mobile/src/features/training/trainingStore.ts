import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ActiveTrainingType } from "./models/ActiveTraining";
import {
  SkillFocusType,
  TrainingSelectionType,
  TrainingTimeType,
} from "./models/Training";
import { UserExerciseDataType } from "./models/UserExerciseData";
import { UserProgressType } from "./models/UserProgress";

type State = {
  selection: TrainingSelectionType | null;
  exerciseList: UserExerciseDataType[] | null;
  progressBefore: UserProgressType | null;
  equipment: string[];
  time: TrainingTimeType;
  activeTraining: ActiveTrainingType | null;
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
  setTrainingStartTime: (time: number) => void;
  setTrainingEndTime: (time: number) => void;
  addPauseTime: (pauseTime: number) => void;
  addSkillTime: (focusArea: SkillFocusType, skillTime: number) => void;
  resetTraining: () => void;
};

export type TrainingState = State & Actions;

export const useTrainingStore = create<TrainingState>()(
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
        const exercise = state.exerciseList?.find(
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
    resetTraining: () =>
      set((state) => {
        const initialState = createInitialState();
        state.exerciseList = initialState.exerciseList;
        state.progressBefore = initialState.progressBefore;
        state.equipment = initialState.equipment;
        state.time = initialState.time;
        state.activeTraining = initialState.activeTraining;
      }),
  })),
);

import { ExerciseDifficultyType } from "@/constants/workoutConstants";
import { asyncStorage } from "@/store/middleware";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ActiveTrainingType } from "./models/ActiveTraining";
import {
  SkillType,
  TrainingSelectionType,
  TrainingTimeType,
} from "./models/Training";
import { UserExerciseDataType } from "./models/UserExerciseData";
import { UserProgressType } from "./models/UserProgress";

export interface TrainingState {
  // State
  selection: TrainingSelectionType | null;
  exerciseList: UserExerciseDataType[] | null;
  progressBefore: UserProgressType | null;
  equipment: string[];
  time: TrainingTimeType;
  activeTraining: ActiveTrainingType | null;

  // Actions
  setTrainingSelection: (selection: TrainingSelectionType | null) => void;
  setExerciseList: (list: UserExerciseDataType[] | null) => void;
  setExerciseFeedback: (
    index: number,
    feedback: ExerciseDifficultyType,
  ) => void;
  setExerciseSkipped: (index: number) => void;
  setProgressBefore: (progress: UserProgressType | null) => void;
  setEquipment: (equipment: string[]) => void;
  setActiveTraining: (training: ActiveTrainingType | null) => void;
  setTrainingStartTime: (time: number) => void;
  setTrainingEndTime: (time: number) => void;
  addPauseTime: (pauseTime: number) => void;
  addSkillTime: (focusArea: SkillType, skillTime: number) => void;
  resetTraining: () => void;
}

const DEFAULT_TIME: TrainingTimeType = {
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
};

export const useTrainingStore = create<TrainingState>()(
  persist(
    immer((set) => ({
      selection: null,
      exerciseList: null,
      progressBefore: null,
      equipment: [],
      time: DEFAULT_TIME,
      activeTraining: null,

      setTrainingSelection: (selection) =>
        set((state) => {
          state.selection = selection;
        }),
      setExerciseList: (list) =>
        set((state) => {
          state.exerciseList = list;
        }),
      setExerciseFeedback: (index, feedback) =>
        set((state) => {
          state.exerciseList?.map((exercise, i) => {
            if (i === index) {
              exercise.feedback.difficulty = feedback;
            }
            return exercise;
          });
        }),
      setExerciseSkipped: (index) =>
        set((state) => {
          state.exerciseList?.map((ex, i) => {
            if (i === index) {
              ex.skipped = true;
            }
            return ex;
          });
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
          state.exerciseList = null;
          state.progressBefore = null;
          state.equipment = [];
          // clone DEFAULT_TIME to avoid retaining mutated reference
          state.time = {
            ...DEFAULT_TIME,
          };
          state.activeTraining = null;
        }),
    })),
    {
      name: "training-store",
      storage: asyncStorage,
    },
  ),
);

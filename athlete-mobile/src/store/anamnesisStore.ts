import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { Route } from "expo-router";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface AnamnesisState {
  values: { [path: string]: any };
  tags: { [tag: string]: string[] };
  originPath?: Route;
  seasonPhase: SeasonPhaseType | null;

  // Actions
  setValue: (path: string, value: any) => void;
  setTag: (tag: string, values: string[]) => void;
  setOriginPath: (path?: Route) => void;
  setSeasonPhase: (phase: SeasonPhaseType | null) => void;
  resetData: () => void;
  setCompleted: () => Promise<void>;
  saveData: () => Promise<void>;
}

type WithoutFunctions<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K];
};

export const DEFAULT_STATE: WithoutFunctions<AnamnesisState> = {
  values: {},
  tags: {
    [TagGroups.LEVEL]: [WorkoutConstants.LEVELS.BEGINNER],
  },
  originPath: undefined,
  seasonPhase: null,
};

/**
 * Anamnesis Store
 *
 * Manages the anamnesis questionnaire state including user answers,
 * tags, and navigation origin. This store handles the multi-step anamnesis flow
 * and persists user responses across sessions.
 *
 * State Keys:
 * - values: Stores form field values (e.g., { height: "175", weight: "75" })
 * - tags: Stores tag arrays (e.g., { POSITION: ["FIELD"], LEVEL: ["BEGINNER"], PAIN: [...] })
 *
 * @example
 * ```tsx
 * const { values, tags, setValue, setTag } = useAnamnesisStore();
 *
 * // Save user answer
 * setValue('height', 180);
 * setTag('POSITION', ['FIELD']);
 * ```
 */
export const useAnamnesisStore = create<AnamnesisState>()(
  persist(
    immer((set, get) => ({
      ...DEFAULT_STATE,

      setValue: (path, value) => {
        set((state) => {
          state.values[path] = value;
        });
      },

      setTag: (tag, values) => {
        set((state) => {
          state.tags[tag] = values;
        });
      },

      setOriginPath: (path) => {
        set((state) => {
          state.originPath = path;
        });
      },

      setSeasonPhase: (phase) => {
        set((state) => {
          state.seasonPhase = phase;
        });
      },

      resetData: () => {
        const currentOriginPath = get().originPath;
        set((state) => {
          state.values = { ...DEFAULT_STATE.values };
          state.tags = { ...DEFAULT_STATE.tags };
          state.originPath = currentOriginPath; // Preserve origin path like legacy
          state.seasonPhase = null;
        });
      },

      setCompleted: async () => {
        // TODO: Implement with Firebase service
        // This should call userStore to set anamnesisCompleted flag
        console.log("setCompleted called");
      },

      saveData: async () => {
        const { values, tags } = get();
        // TODO: Implement with Firebase service
        // This should save both values and tags to Firebase
        console.log("saveData called", { values, tags });
      },
    })),
    {
      name: "anamnesis-storage",
      storage: asyncStorage,
    },
  ),
);

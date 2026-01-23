import { SharedConstants } from "@/constants/sharedConstants";
import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

type State = {
  values: { [path: string]: any };
  tags: { [tag: string]: string[] };
  seasonPhase: SeasonPhaseType | null;
  isSkipped: boolean;
};

export const createInitialState = (): State => ({
  values: {},
  tags: {
    [TagGroups.LEVEL]: [WorkoutConstants.LEVELS.BEGINNER],
  },
  seasonPhase: null,
  isSkipped: false,
});

type Actions = {
  setValue: (path: string, value: any) => void;
  setTag: (tag: string, values: string[]) => void;
  setSeasonPhase: (phase: SeasonPhaseType | null) => void;
  clearAnamnesisData: () => void;
  setCompleted: () => Promise<void>;
  saveData: () => Promise<void>;
  setIsSkipped: (skipped: boolean) => void;
};

export type AnamnesisState = State & Actions;

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
      ...createInitialState(),

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

      setSeasonPhase: (phase) => {
        set((state) => {
          state.seasonPhase = phase;
        });
      },

      clearAnamnesisData: () => {
        set((state) => {
          const initialState = createInitialState();
          state.values = initialState.values;
          state.tags = initialState.tags;
          state.seasonPhase = initialState.seasonPhase;
          state.isSkipped = initialState.isSkipped;
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
      setIsSkipped: (skipped) => {
        set((state) => {
          state.isSkipped = skipped;
        });
      },
    })),
    {
      name: "anamnesis-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);

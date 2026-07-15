import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { anamnesisStoreMigrations } from "./migrations/anamnesisStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

/** Anamnesis form field value types */
export type AnamnesisValue = string | number | boolean | null | undefined;

export type State = {
  /** Form field values keyed by field path (e.g., "height", "weight", "birthday") */
  values: Record<string, AnamnesisValue>;
  /**
   * Tags grouped by tag group key.
   * Keys should match TagGroups enum values (e.g., "LEVEL", "POSITION", "PAIN").
   */
  tags: Record<string, string[]>;
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
  setValue: (path: string, value: AnamnesisValue) => void;
  /** Set tags for a group. Tag param should be a TagGroups value (e.g., "LEVEL", "POSITION") */
  setTag: (tag: string, values: string[]) => void;
  setSeasonPhase: (phase: SeasonPhaseType | null) => void;
  resetAnamnesisData: () => void;
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

      resetAnamnesisData: () => {
        set((state) => {
          const initialState = createInitialState();
          state.values = initialState.values;
          state.tags = initialState.tags;
          state.seasonPhase = initialState.seasonPhase;
          state.isSkipped = initialState.isSkipped;
        });
      },

      setCompleted: async () => {
        // TODO: Persist the anamnesisCompleted flag via the user store
        console.log("setCompleted called");
      },

      saveData: async () => {
        const { values, tags } = get();
        // TODO: Persist values and tags to the backend
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
      version: STORE_VERSIONS.ANAMNESIS,
      migrate: createMigrate(
        STORE_VERSIONS.ANAMNESIS,
        anamnesisStoreMigrations,
        createInitialState,
        "anamnesis",
      ),
    },
  ),
);

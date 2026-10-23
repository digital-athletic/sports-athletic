import type { Template } from "@/schemas/aiwl.schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { customWorkoutsStoreMigrations } from "./migrations/customWorkoutsStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type CustomWorkout = {
  id: string;
  teamId: string | null;
  template: Template;
  importedAt: number;
};

export type State = { workoutsById: Record<string, CustomWorkout> };

const createInitialState = (): State => ({ workoutsById: {} });

export const listWorkoutsForTeam = (
  workoutsById: State["workoutsById"],
  teamId: string | null,
): CustomWorkout[] =>
  Object.values(workoutsById)
    .filter((workout) => workout.teamId === teamId)
    .sort((a, b) => a.importedAt - b.importedAt);

export const findCustomTemplate = (
  workoutsById: State["workoutsById"],
  id: string,
): Template | undefined =>
  Object.hasOwn(workoutsById, id) ? workoutsById[id].template : undefined;

type Actions = {
  saveCustomWorkout: (
    template: Template,
    teamId: string | null,
  ) => CustomWorkout;
  clearCustomWorkouts: () => void;
  setHasHydrated: (hydrated: boolean) => void;
};

export type CustomWorkoutsState = State & { _hasHydrated: boolean } & Actions;

export const generateCustomWorkoutId = (): string =>
  `custom-${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;

export const useCustomWorkoutsStore = create<CustomWorkoutsState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),
      _hasHydrated: false,

      saveCustomWorkout: (template, teamId) => {
        const existing = Object.values(get().workoutsById).find(
          (workout) =>
            workout.teamId === teamId && workout.template.id === template.id,
        );
        const entry: CustomWorkout = {
          id: existing?.id ?? generateCustomWorkoutId(),
          teamId,
          template,
          importedAt: Date.now(),
        };
        set((state) => {
          state.workoutsById[entry.id] = entry;
        });
        return entry;
      },

      clearCustomWorkouts: () =>
        set((state) => {
          state.workoutsById = createInitialState().workoutsById;
        }),

      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),
    })),
    {
      name: "custom-workouts-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.CUSTOM_WORKOUTS,
      migrate: createMigrate(
        STORE_VERSIONS.CUSTOM_WORKOUTS,
        customWorkoutsStoreMigrations,
        createInitialState,
        "custom-workouts",
      ),
      partialize: (state): State => ({ workoutsById: state.workoutsById }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating custom workouts store:", error);
        }
        useCustomWorkoutsStore.getState().setHasHydrated(true);
      },
    },
  ),
);

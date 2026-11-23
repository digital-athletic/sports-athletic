import type { PlaceType } from "@/constants/workoutConstants";
import type { DrawnWorkout } from "@/features/customWorkouts/drawnWorkout";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { drawnWorkoutsStoreMigrations } from "./migrations/drawnWorkoutsStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type State = {
  drawnWorkouts: Record<string, Partial<Record<PlaceType, DrawnWorkout>>>;
};

const createInitialState = (): State => ({ drawnWorkouts: {} });

type Actions = {
  saveDrawnWorkout: (
    workoutId: string,
    place: PlaceType,
    drawnWorkout: DrawnWorkout,
  ) => void;
  clearDrawnWorkouts: () => void;
  setHasHydrated: (hydrated: boolean) => void;
};

export type DrawnWorkoutsState = State & { _hasHydrated: boolean } & Actions;

export const useDrawnWorkoutsStore = create<DrawnWorkoutsState>()(
  persist(
    immer((set) => ({
      ...createInitialState(),
      _hasHydrated: false,

      saveDrawnWorkout: (workoutId, place, drawnWorkout) =>
        set((state) => {
          state.drawnWorkouts[workoutId] = {
            ...state.drawnWorkouts[workoutId],
            [place]: drawnWorkout,
          };
        }),

      clearDrawnWorkouts: () =>
        set((state) => {
          state.drawnWorkouts = createInitialState().drawnWorkouts;
        }),

      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),
    })),
    {
      name: "drawn-workouts-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.DRAWN_WORKOUTS,
      migrate: createMigrate(
        STORE_VERSIONS.DRAWN_WORKOUTS,
        drawnWorkoutsStoreMigrations,
        createInitialState,
        "drawn-workouts",
      ),
      partialize: (state): State => ({
        drawnWorkouts: state.drawnWorkouts,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating drawn workouts store:", error);
        }
        useDrawnWorkoutsStore.getState().setHasHydrated(true);
      },
    },
  ),
);

import type { PlaceType } from "@/constants/workoutConstants";
import type { SavedVersion } from "@/features/customWorkouts/savedVersion";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { setListVersionsStoreMigrations } from "./migrations/setListVersionsStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type State = {
  versionsByWorkout: Record<string, Partial<Record<PlaceType, SavedVersion>>>;
};

const createInitialState = (): State => ({ versionsByWorkout: {} });

type Actions = {
  saveVersion: (
    workoutId: string,
    place: PlaceType,
    version: SavedVersion,
  ) => void;
  clearSetListVersions: () => void;
  setHasHydrated: (hydrated: boolean) => void;
};

export type SetListVersionsState = State & { _hasHydrated: boolean } & Actions;

export const useSetListVersionsStore = create<SetListVersionsState>()(
  persist(
    immer((set) => ({
      ...createInitialState(),
      _hasHydrated: false,

      saveVersion: (workoutId, place, version) =>
        set((state) => {
          state.versionsByWorkout[workoutId] = {
            ...state.versionsByWorkout[workoutId],
            [place]: version,
          };
        }),

      clearSetListVersions: () =>
        set((state) => {
          state.versionsByWorkout = createInitialState().versionsByWorkout;
        }),

      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),
    })),
    {
      name: "set-list-versions-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.SET_LIST_VERSIONS,
      migrate: createMigrate(
        STORE_VERSIONS.SET_LIST_VERSIONS,
        setListVersionsStoreMigrations,
        createInitialState,
        "set-list-versions",
      ),
      partialize: (state): State => ({
        versionsByWorkout: state.versionsByWorkout,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating set list versions store:", error);
        }
        useSetListVersionsStore.getState().setHasHydrated(true);
      },
    },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type SportTest } from "@/features/performanceTests/models/SportTest";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { sportTestsStoreMigrations } from "./migrations/sportTestsStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type State = {
  testsBySport: Partial<Record<string, SportTest[]>>;
};

const createInitialState = (): State => ({ testsBySport: {} });

type Actions = {
  setTests: (sport: string, tests: SportTest[]) => void;
  reset: () => void;
};

export type SportTestsStoreState = State & Actions;

/** Last loaded performance tests per sport, so the list shows offline. */
export const useSportTestsStore = create<SportTestsStoreState>()(
  persist(
    (set) => ({
      ...createInitialState(),

      setTests: (sport, tests) =>
        set((state) => ({
          testsBySport: { ...state.testsBySport, [sport]: tests },
        })),

      reset: () => set(createInitialState()),
    }),
    {
      name: "sport-tests-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.SPORT_TESTS,
      migrate: createMigrate(
        STORE_VERSIONS.SPORT_TESTS,
        sportTestsStoreMigrations,
        createInitialState,
        "sport-tests",
      ),
    },
  ),
);

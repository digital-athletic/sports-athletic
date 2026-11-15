import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PerformanceTestValue } from "@/features/performanceTests/models/PerformanceTestValue";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { performanceTestValuesStoreMigrations } from "./migrations/performanceTestValuesStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type State = {
  /** The values of every sport and test in the order the athlete entered them. */
  values: PerformanceTestValue[];
};

const createInitialState = (): State => ({ values: [] });

type Actions = {
  addValue: (entry: Omit<PerformanceTestValue, "id">) => void;
  reset: () => void;
};

export type PerformanceTestValuesStoreState = State & Actions;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** Values the athlete entered for performance tests, kept on the device only. */
export const usePerformanceTestValuesStore =
  create<PerformanceTestValuesStoreState>()(
    persist(
      (set) => ({
        ...createInitialState(),

        addValue: (entry) =>
          set((state) => ({
            values: [...state.values, { ...entry, id: generateId() }],
          })),

        reset: () => set(createInitialState()),
      }),
      {
        name: "performance-test-values-storage",
        storage: asyncStorage,
        version: STORE_VERSIONS.PERFORMANCE_TEST_VALUES,
        migrate: createMigrate(
          STORE_VERSIONS.PERFORMANCE_TEST_VALUES,
          performanceTestValuesStoreMigrations,
          createInitialState,
          "performance-test-values",
        ),
      },
    ),
  );

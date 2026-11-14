import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PerformanceTestValue } from "@/features/performanceTests/models/PerformanceTestValue";
import { type ISODateString } from "@/utils/date";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { performanceTestValuesStoreMigrations } from "./migrations/performanceTestValuesStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export type State = {
  valuesByTest: Partial<Record<string, PerformanceTestValue[]>>;
};

const createInitialState = (): State => ({ valuesByTest: {} });

type Actions = {
  /** `key` is sport and test code, e.g. "SPORT_HANDBALL/SPRINT_5M". */
  addValue: (
    key: string,
    entry: { date: ISODateString; value: number },
  ) => void;
  reset: () => void;
};

export type PerformanceTestValuesStoreState = State & Actions;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** Values the athlete entered per test, kept on the device only. */
export const usePerformanceTestValuesStore =
  create<PerformanceTestValuesStoreState>()(
    persist(
      (set) => ({
        ...createInitialState(),

        addValue: (key, entry) =>
          set((state) => ({
            valuesByTest: {
              ...state.valuesByTest,
              [key]: [
                ...(state.valuesByTest[key] ?? []),
                { id: generateId(), ...entry },
              ],
            },
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

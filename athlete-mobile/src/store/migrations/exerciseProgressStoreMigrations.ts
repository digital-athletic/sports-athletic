import type { MigrationMap } from "./createMigrate";
import type { State } from "../exerciseProgressStore";

export const exerciseProgressStoreMigrations: MigrationMap<State> = {
  14: (state) => {
    const testHistory = state.testHistory;
    if (!testHistory || testHistory.length === 0) return state;

    const migratedHistory = testHistory.map((entry) => {
      const raw = entry as Record<string, unknown>;
      const { testDate, knee, hip, ...rest } = raw;
      return {
        ...rest,
        testAt: testDate ?? 0,
        kneeDominant: knee ?? {},
        hipHinge: hip ?? {},
      };
    });

    return {
      ...state,
      testHistory: migratedHistory,
    } as State;
  },
};

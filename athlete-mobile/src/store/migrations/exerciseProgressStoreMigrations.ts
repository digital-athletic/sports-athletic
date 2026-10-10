import type { MigrationMap } from "./createMigrate";
import type { State } from "../exerciseProgressStore";

// Jump squats with authored test-based weights. Their stored weights were
// 15-25% of the old base and would override the new 5-20% squat 1RM range.
const JUMP_SQUAT_IDS_WITH_RESET_WEIGHT = ["292", "294"];

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
  15: (state) => {
    const exerciseData = { ...state.exerciseData };
    for (const exerciseId of JUMP_SQUAT_IDS_WITH_RESET_WEIGHT) {
      const entry = exerciseData[exerciseId];
      if (entry?.weight === undefined) continue;
      const withoutWeight = { ...entry };
      delete withoutWeight.weight;
      exerciseData[exerciseId] = withoutWeight;
    }
    return { ...state, exerciseData };
  },
};

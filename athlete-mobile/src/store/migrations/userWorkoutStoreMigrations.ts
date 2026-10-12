import type { MigrationMap } from "./createMigrate";
import type { State } from "../userWorkoutStore";

import { migratePositionTags } from "./positionMigration";

export const userWorkoutStoreMigrations: MigrationMap<State> = {
  // Older plan creation let adult-only branches into a child's plan and max
  // strength lifts into days without their equipment. The plan itself stays;
  // the app checks it once at start and rebuilds it only when it is broken.
  16: (state) =>
    state.trainingPlan ? { ...state, planCheckPending: true } : state,
  15: (state) => ({
    ...state,
    workoutData: {
      ...state.workoutData,
      tags: migratePositionTags(state.workoutData?.tags),
    },
  }),
  14: (state) => {
    const maxValues = state.workoutData?.maxValues as
      | Record<string, unknown>
      | undefined;
    if (!maxValues) return state;

    const { testDate, knee, hip, ...rest } = maxValues;
    return {
      ...state,
      workoutData: {
        ...state.workoutData,
        maxValues: {
          ...rest,
          testAt: testDate ?? 0,
          kneeDominant: knee ?? {},
          hipHinge: hip ?? {},
        },
      },
    } as State;
  },
};

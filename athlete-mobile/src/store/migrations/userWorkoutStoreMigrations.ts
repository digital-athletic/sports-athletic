import type { MigrationMap } from "./createMigrate";
import type { State } from "../userWorkoutStore";

import { migratePositionTags } from "./positionMigration";

export const userWorkoutStoreMigrations: MigrationMap<State> = {
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

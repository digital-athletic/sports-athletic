import type { State } from "@/features/training/trainingStore";
import type { MigrationMap } from "./createMigrate";

export const trainingStoreMigrations: MigrationMap<State> = {
  // v14 -> v15: added trainingViewMode/completedExerciseIndices for list-view training mode.
  14: (state) => ({
    ...state,
    trainingViewMode: null,
    completedExerciseIndices: [],
  }),
};

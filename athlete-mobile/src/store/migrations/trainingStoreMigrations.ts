import type { State } from "@/features/training/trainingStore";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { MigrationMap } from "./createMigrate";

type LegacyTrainingState = State & {
  activeExerciseIndex?: number;
  completedExerciseIndices?: number[];
};

export const trainingStoreMigrations: MigrationMap<State> = {
  // v14 -> v15: added trainingViewMode for list-view training mode.
  14: (state) => ({
    ...state,
    trainingViewMode: null,
  }),
  // v15 -> v16: folded activeExerciseIndex/completedExerciseIndices into each
  // exerciseList entry's `completed` mark; the active pointer is now derived.
  15: (state) => {
    const legacy = state as LegacyTrainingState;
    const completedIndices = new Set(legacy.completedExerciseIndices ?? []);
    const nextState: LegacyTrainingState = {
      ...legacy,
      exerciseList: legacy.exerciseList
        ? legacy.exerciseList.map(
            (exercise, index): UserExerciseDataType =>
              completedIndices.has(index)
                ? { ...exercise, completed: true }
                : exercise,
          )
        : legacy.exerciseList,
    };
    delete nextState.completedExerciseIndices;
    delete nextState.activeExerciseIndex;

    return nextState;
  },
};

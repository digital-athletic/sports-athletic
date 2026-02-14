import type { MigrationMap } from "./createMigrate";
import type { State } from "../authStore";

export const authStoreMigrations: MigrationMap<State> = {
  // Future migrations go here, e.g.:
  // 14: (state) => ({ ...state, newField: defaultValue }),
};

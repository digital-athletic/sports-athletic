import type { MigrationMap } from "./createMigrate";
import type { State } from "../userSettingsStore";

export const userSettingsStoreMigrations: MigrationMap<State> = {
  // Future migrations go here, e.g.:
  // 14: (state) => ({ ...state, newField: defaultValue }),
};

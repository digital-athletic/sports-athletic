import type { MigrationMap } from "./createMigrate";
import type { State } from "../syncQueueStore";

export const syncQueueStoreMigrations: MigrationMap<State> = {
  // Future migrations go here, e.g.:
  // 14: (state) => ({ ...state, newField: defaultValue }),
};

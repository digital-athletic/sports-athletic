import type { MigrationMap } from "./createMigrate";
import type { State } from "../userDataBackupStore";

export const userDataBackupStoreMigrations: MigrationMap<State> = {
  // Future migrations go here, e.g.:
  // 15: (state) => ({ ...state, newField: defaultValue }),
};

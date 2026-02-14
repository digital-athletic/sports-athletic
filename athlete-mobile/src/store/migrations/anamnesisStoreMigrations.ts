import type { MigrationMap } from "./createMigrate";
import type { State } from "../anamnesisStore";

export const anamnesisStoreMigrations: MigrationMap<State> = {
  // Future migrations go here, e.g.:
  // 14: (state) => ({ ...state, newField: defaultValue }),
};

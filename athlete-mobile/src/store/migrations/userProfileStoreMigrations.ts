import type { MigrationMap } from "./createMigrate";
import type { State } from "../userProfileStore";

export const userProfileStoreMigrations: MigrationMap<State> = {
  14: (state) => ({
    ...state,
    warnings: (state as Partial<State>).warnings ?? { painAlertSeen: false },
  }),
};

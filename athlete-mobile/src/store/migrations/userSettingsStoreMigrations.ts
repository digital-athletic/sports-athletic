import type { MigrationMap } from "./createMigrate";
import type { State } from "../userSettingsStore";

export const userSettingsStoreMigrations: MigrationMap<State> = {
  14: (state) => ({
    ...state,
    consentStatus:
      (state as Partial<State>).consentStatus ?? ("loading" as const),
  }),
};

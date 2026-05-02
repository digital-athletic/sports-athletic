import type { MigrationMap } from "./createMigrate";
import type { State } from "../authStore";

export const authStoreMigrations: MigrationMap<State> = {
  // Strip the token field from persisted auth — the Supabase client manages
  // its own session; storing the raw JWT in AsyncStorage is a security risk.
  14: (state) => ({
    ...state,
    auth: state.auth ? { userId: state.auth.userId } : null,
  }),
};

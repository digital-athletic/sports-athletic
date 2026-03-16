import type { MigrationMap } from "./createMigrate";
import type { State } from "../anamnesisStore";
import { migratePositionTags } from "./positionMigration";

export const anamnesisStoreMigrations: MigrationMap<State> = {
  14: (state) => ({
    ...state,
    tags: migratePositionTags(state.tags),
  }),
};

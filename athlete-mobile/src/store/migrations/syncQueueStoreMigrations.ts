import type { MigrationMap } from "./createMigrate";
import type { State } from "../syncQueueStore";

export const syncQueueStoreMigrations: MigrationMap<State> = {
  // 14 to 15: legacy items get no owner; the first user who processes the
  // queue claims them. Auth may not be hydrated here, so it is not read.
  14: (state) => ({
    ...state,
    queue: state.queue.map((item) => ({
      ...item,
      ownerUserId: item.ownerUserId ?? null,
    })),
  }),
};

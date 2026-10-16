import type { MigrationMap } from "./createMigrate";
import type { State } from "../syncQueueStore";
import { useAuthStore } from "../authStore";

export const syncQueueStoreMigrations: MigrationMap<State> = {
  // 14 to 15: stamp the owner. Auth may not be hydrated yet, so the owner can
  // be null; the first user who processes the queue claims such items.
  14: (state) => {
    const userId = useAuthStore.getState().auth?.userId ?? null;
    return {
      ...state,
      queue: state.queue.map((item) => ({
        ...item,
        ownerUserId: item.ownerUserId ?? userId,
      })),
    };
  },
};

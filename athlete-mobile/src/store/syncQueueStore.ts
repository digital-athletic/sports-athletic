import { Logger } from "@/services/Logger";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { syncQueueStoreMigrations } from "./migrations/syncQueueStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export const MAX_RETRY_ATTEMPTS = 5;
export const MAX_QUEUE_SIZE = 500;

export type SyncItemType =
  | "COMPLETED_WORKOUT"
  | "EXERCISE_DATA"
  | "STRENGTH_TEST";

export type SyncStatus = "PENDING" | "IN_PROGRESS" | "FAILED";

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  referenceId: string;
  payload: unknown;
  status: SyncStatus;
  createdAt: number;
  lastAttemptAt?: number;
  attemptCount: number;
  error?: string;
}

export type State = {
  queue: SyncQueueItem[];
};

const createInitialState = (): State => ({
  queue: [],
});

type Actions = {
  enqueue: (item: {
    type: SyncItemType;
    referenceId: string;
    payload: unknown;
  }) => void;
  markInProgress: (id: string) => void;
  markCompleted: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  resetStaleItems: () => void;
  clearSyncQueue: () => void;
};

type Selectors = {
  getNextPending: () => SyncQueueItem | undefined;
  getPendingCount: () => number;
  getFailedItems: () => SyncQueueItem[];
  hasItemsToSync: () => boolean;
};

export type SyncQueueState = State & Actions & Selectors;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getRetryDelayMs(attemptCount: number): number {
  return 2 ** attemptCount * 60_000;
}

function isReadyToProcess(item: SyncQueueItem, now: number): boolean {
  if (item.attemptCount >= MAX_RETRY_ATTEMPTS) {
    return false;
  }
  if (item.status === "PENDING") {
    return true;
  }
  if (item.status !== "FAILED") {
    return false;
  }
  // A negative elapsed means the device clock jumped backwards; retry
  // immediately instead of leaving the item wedged for the whole skew
  const elapsed = now - (item.lastAttemptAt ?? 0);
  return elapsed < 0 || elapsed >= getRetryDelayMs(item.attemptCount);
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),

      enqueue: (item) => {
        if (get().queue.length >= MAX_QUEUE_SIZE) {
          Logger.logError(
            new Error(
              `Sync queue full (${MAX_QUEUE_SIZE} items). Item dropped: ${item.type}`,
            ),
          );
          return;
        }
        set((state) => {
          state.queue.push({
            id: generateId(),
            type: item.type,
            referenceId: item.referenceId,
            payload: item.payload,
            status: "PENDING",
            createdAt: Date.now(),
            attemptCount: 0,
          });
        });
      },

      markInProgress: (id) =>
        set((state) => {
          const item = state.queue.find((i) => i.id === id);
          if (item) {
            item.status = "IN_PROGRESS";
            item.lastAttemptAt = Date.now();
          }
        }),

      markCompleted: (id) =>
        set((state) => {
          state.queue = state.queue.filter((i) => i.id !== id);
        }),

      markFailed: (id, error) => {
        const item = get().queue.find((i) => i.id === id);
        if (!item) {
          return;
        }
        if (item.attemptCount + 1 >= MAX_RETRY_ATTEMPTS) {
          Logger.logError(
            new Error(
              `Sync item dropped after ${item.attemptCount + 1} failed attempts: ${item.type} (${item.referenceId})`,
            ),
          );
          set((state) => {
            state.queue = state.queue.filter((i) => i.id !== id);
          });
          return;
        }
        set((state) => {
          const failed = state.queue.find((i) => i.id === id);
          if (failed) {
            failed.status = "FAILED";
            failed.error = error;
            failed.attemptCount += 1;
            failed.lastAttemptAt = Date.now();
          }
        });
      },

      resetStaleItems: () =>
        set((state) => {
          // Heal queues persisted before exhausted items were pruned on failure
          state.queue = state.queue.filter(
            (i) => i.attemptCount < MAX_RETRY_ATTEMPTS,
          );
          for (const item of state.queue) {
            if (item.status === "IN_PROGRESS") {
              item.status = "PENDING";
            }
          }
        }),

      clearSyncQueue: () =>
        set((state) => {
          state.queue = [];
        }),

      getNextPending: () => {
        const { queue } = get();
        const now = Date.now();
        return queue.find((i) => isReadyToProcess(i, now));
      },

      getPendingCount: () => {
        const { queue } = get();
        return queue.filter((i) => i.status === "PENDING").length;
      },

      getFailedItems: () => {
        const { queue } = get();
        return queue.filter((i) => i.status === "FAILED");
      },

      hasItemsToSync: () => {
        const { queue } = get();
        const now = Date.now();
        return queue.some((i) => isReadyToProcess(i, now));
      },
    })),
    {
      name: "sync-queue-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.SYNC_QUEUE,
      migrate: createMigrate(
        STORE_VERSIONS.SYNC_QUEUE,
        syncQueueStoreMigrations,
        createInitialState,
        "sync-queue",
      ),
    },
  ),
);

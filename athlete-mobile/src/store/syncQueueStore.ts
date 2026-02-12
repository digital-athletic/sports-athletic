import { SharedConstants } from "@/constants/sharedConstants";
import { Logger } from "@/services/Logger";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

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

type State = {
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

      markFailed: (id, error) =>
        set((state) => {
          const item = state.queue.find((i) => i.id === id);
          if (item) {
            item.status = "FAILED";
            item.error = error;
            item.attemptCount += 1;
            item.lastAttemptAt = Date.now();
          }
        }),

      resetStaleItems: () =>
        set((state) => {
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
        return queue.find(
          (i) => i.status === "PENDING" && i.attemptCount < MAX_RETRY_ATTEMPTS,
        );
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
        return queue.some(
          (i) =>
            (i.status === "PENDING" || i.status === "FAILED") &&
            i.attemptCount < MAX_RETRY_ATTEMPTS,
        );
      },
    })),
    {
      name: "sync-queue-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);

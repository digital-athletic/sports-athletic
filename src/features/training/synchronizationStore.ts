import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface SynchronizationType {
  isVisible: boolean;
  updating: boolean;
  failed: boolean;
  finished: boolean;
  start: number;
}

interface SynchronizationState {
  synchronization: SynchronizationType;
  startSynchronization: () => void;
  stopSynchronization: (finished: boolean, failed: boolean) => void;
  resetSynchronization: () => void;
}

const DEFAULT_SYNCHRONIZATION_DATA: SynchronizationType = {
  isVisible: false,
  updating: false,
  failed: false,
  finished: false,
  start: 0,
};

/**
 * Synchronization Store
 *
 * Manages training data synchronization state including progress visibility,
 * completion status, and timeout handling.
 */
export const useSynchronizationStore = create<SynchronizationState>()(
  immer((set, get) => ({
    synchronization: DEFAULT_SYNCHRONIZATION_DATA,

    startSynchronization: () =>
      set((state) => {
        state.synchronization = {
          isVisible: true,
          updating: true,
          failed: false,
          finished: false,
          start: Date.now(),
        };
      }),

    stopSynchronization: (finished: boolean, failed: boolean) =>
      set((state) => {
        const currentSync = get().synchronization;
        if (currentSync.failed || currentSync.finished) {
          return;
        }
        state.synchronization = {
          isVisible: true,
          updating: false,
          failed,
          finished,
          start: currentSync.start,
        };
      }),

    resetSynchronization: () =>
      set((state) => {
        state.synchronization = DEFAULT_SYNCHRONIZATION_DATA;
      }),
  })),
);

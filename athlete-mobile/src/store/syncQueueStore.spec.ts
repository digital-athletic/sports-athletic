import { act, renderHook } from "@testing-library/react-native";
import {
  useSyncQueueStore,
  MAX_RETRY_ATTEMPTS,
  MAX_QUEUE_SIZE,
} from "./syncQueueStore";

// Rewinds an item's last attempt far past any retry backoff window
function backdateLastAttempt(itemId: string): void {
  useSyncQueueStore.setState((state) => {
    const item = state.queue.find((i) => i.id === itemId);
    if (item) item.lastAttemptAt = Date.now() - 60 * 60 * 1000;
  });
}

describe("syncQueueStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useSyncQueueStore());
    act(() => {
      result.current.clearSyncQueue();
    });
  });

  describe("initial state", () => {
    it("has empty queue and no items to sync", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      expect(result.current.queue).toHaveLength(0);
      expect(result.current.getPendingCount()).toBe(0);
      expect(result.current.hasItemsToSync()).toBe(false);
    });
  });

  describe("enqueue", () => {
    it("adds item with correct defaults", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "workout-1",
          payload: { id: "workout-1", timestamp: 1000 },
        });
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]).toEqual(
        expect.objectContaining({
          type: "COMPLETED_WORKOUT",
          referenceId: "workout-1",
          payload: { id: "workout-1", timestamp: 1000 },
          status: "PENDING",
          attemptCount: 0,
        }),
      );
      expect(typeof result.current.queue[0].id).toBe("string");
      expect(typeof result.current.queue[0].createdAt).toBe("number");
    });

    it("maintains FIFO order for multiple items", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
        result.current.enqueue({
          type: "STRENGTH_TEST",
          referenceId: "t1",
          payload: {},
        });
      });

      expect(result.current.queue).toHaveLength(3);
      expect(result.current.queue[0].referenceId).toBe("w1");
      expect(result.current.queue[1].referenceId).toBe("e1");
      expect(result.current.queue[2].referenceId).toBe("t1");
    });

    it("rejects items when queue is at max capacity", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        for (let i = 0; i < MAX_QUEUE_SIZE + 5; i++) {
          result.current.enqueue({
            type: "EXERCISE_DATA",
            referenceId: `e-${i}`,
            payload: {},
          });
        }
      });

      expect(result.current.queue).toHaveLength(MAX_QUEUE_SIZE);
    });
  });

  describe("markInProgress", () => {
    it("updates status and lastAttemptAt", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.markInProgress(itemId);
      });

      expect(result.current.queue[0].status).toBe("IN_PROGRESS");
      expect(typeof result.current.queue[0].lastAttemptAt).toBe("number");
    });
  });

  describe("markCompleted", () => {
    it("removes item from queue", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.markCompleted(itemId);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].referenceId).toBe("e1");
    });
  });

  describe("markFailed", () => {
    it("updates status, error, and increments attemptCount", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.markFailed(itemId, "Network error");
      });

      expect(result.current.queue[0]).toEqual(
        expect.objectContaining({
          status: "FAILED",
          error: "Network error",
          attemptCount: 1,
        }),
      );
      expect(typeof result.current.queue[0].lastAttemptAt).toBe("number");
    });
  });

  describe("resetStaleItems", () => {
    it("resets IN_PROGRESS items to PENDING", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
      });

      const firstId = result.current.queue[0].id;

      act(() => {
        result.current.markInProgress(firstId);
      });

      expect(result.current.queue[0].status).toBe("IN_PROGRESS");

      act(() => {
        result.current.resetStaleItems();
      });

      expect(result.current.queue[0].status).toBe("PENDING");
      expect(result.current.queue[1].status).toBe("PENDING");
    });
  });

  describe("getNextPending", () => {
    it("returns first PENDING item", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
      });

      const firstId = result.current.queue[0].id;

      act(() => {
        result.current.markInProgress(firstId);
      });

      const next = result.current.getNextPending();
      expect(next?.referenceId).toBe("e1");
    });

    it("returns undefined when queue is empty", () => {
      const { result } = renderHook(() => useSyncQueueStore());
      expect(result.current.getNextPending()).toBeUndefined();
    });

    it("skips items that exceeded max retry attempts", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
      });

      const firstId = result.current.queue[0].id;

      act(() => {
        for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
          result.current.markFailed(firstId, "error");
          // Reset to pending so it can be retried in the test
          useSyncQueueStore.setState((state) => {
            const item = state.queue.find((i) => i.id === firstId);
            if (item) item.status = "PENDING";
          });
        }
      });

      const next = result.current.getNextPending();
      expect(next?.referenceId).toBe("e1");
    });
  });

  describe("getFailedItems", () => {
    it("returns only failed items", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
      });

      const firstId = result.current.queue[0].id;

      act(() => {
        result.current.markFailed(firstId, "Network error");
      });

      const failed = result.current.getFailedItems();
      expect(failed).toHaveLength(1);
      expect(failed[0].referenceId).toBe("w1");
    });
  });

  describe("clearSyncQueue", () => {
    it("empties the queue", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
        result.current.enqueue({
          type: "EXERCISE_DATA",
          referenceId: "e1",
          payload: {},
        });
      });

      expect(result.current.queue).toHaveLength(2);

      act(() => {
        result.current.clearSyncQueue();
      });

      expect(result.current.queue).toHaveLength(0);
      expect(result.current.hasItemsToSync()).toBe(false);
    });
  });

  describe("retrying failed items", () => {
    it("getNextPending returns a failed item whose backoff window has long passed", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.markFailed(itemId, "Network error");
        backdateLastAttempt(itemId);
      });

      expect(result.current.queue[0].attemptCount).toBeLessThan(
        MAX_RETRY_ATTEMPTS,
      );
      expect(result.current.getNextPending()?.id).toBe(itemId);
    });

    it("getNextPending and hasItemsToSync agree so triggered syncs make progress", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.markFailed(itemId, "Network error");
        backdateLastAttempt(itemId);
      });

      // If the queue reports syncable items but exposes none for processing,
      // sync is triggered forever and never completes
      expect(result.current.hasItemsToSync()).toBe(true);
      expect(result.current.getNextPending()).toBeDefined();
    });
  });

  describe("startup recovery of a wedged queue", () => {
    it("makes a previously failed item processable again", () => {
      const { result } = renderHook(() => useSyncQueueStore());

      act(() => {
        result.current.enqueue({
          type: "COMPLETED_WORKOUT",
          referenceId: "w1",
          payload: {},
        });
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.markFailed(itemId, "Network error");
        backdateLastAttempt(itemId);
      });

      act(() => {
        result.current.resetStaleItems();
      });

      expect(result.current.getNextPending()).toBeDefined();
    });
  });

  describe("queue capacity with exhausted items", () => {
    it("accepts new items when the queue is full of retry exhausted items", () => {
      const store = useSyncQueueStore.getState();

      for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
        store.enqueue({
          type: "EXERCISE_DATA",
          referenceId: `exhausted${i}`,
          payload: {},
        });
      }

      const ids = useSyncQueueStore.getState().queue.map((i) => i.id);
      for (const id of ids) {
        for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
          store.markFailed(id, "Network error");
        }
      }

      // Every item is now unretryable dead weight; a new completed workout
      // must not be silently dropped because of them
      store.enqueue({
        type: "COMPLETED_WORKOUT",
        referenceId: "newWorkout",
        payload: {},
      });

      expect(
        useSyncQueueStore
          .getState()
          .queue.some((i) => i.referenceId === "newWorkout"),
      ).toBe(true);
    });
  });
});

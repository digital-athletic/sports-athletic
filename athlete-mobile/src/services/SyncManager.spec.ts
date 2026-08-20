import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuthStore } from "@/store/authStore";
import { useSyncQueueStore } from "@/store/syncQueueStore";
import { SyncManager } from "./SyncManager";

const mockProcessQueue = jest.fn().mockResolvedValue(undefined);
const mockResetProcessingFlag = jest.fn();
jest.mock("./SyncService", () => ({
  processQueue: (...args: unknown[]) => mockProcessQueue(...args),
  resetProcessingFlag: (...args: unknown[]) => mockResetProcessingFlag(...args),
}));

jest.mock("./Logger", () => ({
  Logger: { logError: jest.fn() },
}));

let netInfoCallback: (state: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}) => void;
const mockNetInfoUnsubscribe = jest.fn();
const mockNetInfoFetch = jest.fn().mockResolvedValue({
  isConnected: true,
  isInternetReachable: true,
});
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((cb: typeof netInfoCallback) => {
    netInfoCallback = cb;
    return mockNetInfoUnsubscribe;
  }),
  fetch: (...args: unknown[]) => mockNetInfoFetch(...args),
}));

let appStateCallback: (state: string) => void;
const mockAppStateRemove = jest.fn();
jest.spyOn(AppState, "addEventListener").mockImplementation(((
  _event: string,
  cb: (state: string) => void,
) => {
  appStateCallback = cb;
  return { remove: mockAppStateRemove };
}) as typeof AppState.addEventListener);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockProcessQueue.mockResolvedValue(undefined);
  SyncManager.resetForTesting();
  useSyncQueueStore.getState().clearSyncQueue();
  useAuthStore.getState().setAuth({ userId: "user-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("singleton", () => {
  it("returns the same instance on repeated calls", () => {
    const a = SyncManager.getInstance();
    const b = SyncManager.getInstance();
    expect(a).toBe(b);
  });
});

describe("start", () => {
  it("subscribes to NetInfo and AppState", () => {
    const manager = SyncManager.getInstance();
    manager.start();

    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("eagerly fetches current network state on start", () => {
    mockNetInfoFetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });

    SyncManager.getInstance().start();

    expect(mockNetInfoFetch).toHaveBeenCalledTimes(1);
  });

  it("is idempotent — calling twice does not duplicate subscriptions", () => {
    const manager = SyncManager.getInstance();
    manager.start();
    manager.start();

    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("resets stale IN_PROGRESS items on start", () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });
    const itemId = useSyncQueueStore.getState().queue[0].id;
    useSyncQueueStore.getState().markInProgress(itemId);

    expect(useSyncQueueStore.getState().queue[0].status).toBe("IN_PROGRESS");

    SyncManager.getInstance().start();

    expect(useSyncQueueStore.getState().queue[0].status).toBe("PENDING");
  });
});

describe("stop", () => {
  it("cleans up all subscriptions and interval", () => {
    const manager = SyncManager.getInstance();
    manager.start();
    manager.stop();

    expect(mockNetInfoUnsubscribe).toHaveBeenCalled();
    expect(mockAppStateRemove).toHaveBeenCalled();
    expect(manager.isStarted).toBe(false);
  });

  it("resets online to false when stopped", () => {
    const manager = SyncManager.getInstance();
    manager.start();
    netInfoCallback({ isConnected: true, isInternetReachable: true });
    expect(manager.isOnline).toBe(true);

    manager.stop();
    expect(manager.isOnline).toBe(false);
  });
});

describe("triggerSync", () => {
  it("calls processQueue when online and authenticated with items", () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    const manager = SyncManager.getInstance();
    manager.start();
    netInfoCallback({ isConnected: true, isInternetReachable: true });

    expect(mockProcessQueue).toHaveBeenCalled();
  });

  it("does nothing when offline", () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    const manager = SyncManager.getInstance();
    manager.start();
    netInfoCallback({ isConnected: false, isInternetReachable: false });
    mockProcessQueue.mockClear();

    manager.triggerSync();

    expect(mockProcessQueue).not.toHaveBeenCalled();
  });

  it("does nothing when not authenticated", () => {
    useAuthStore.getState().clearAuth();
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    const manager = SyncManager.getInstance();
    manager.start();
    netInfoCallback({ isConnected: true, isInternetReachable: true });
    mockProcessQueue.mockClear();

    manager.triggerSync();

    expect(mockProcessQueue).not.toHaveBeenCalled();
  });

  it("does nothing when queue is empty", () => {
    const manager = SyncManager.getInstance();
    manager.start();
    netInfoCallback({ isConnected: true, isInternetReachable: true });
    mockProcessQueue.mockClear();

    manager.triggerSync();

    expect(mockProcessQueue).not.toHaveBeenCalled();
  });
});

describe("connectivity change triggers sync", () => {
  it("triggers sync when going from offline to online", () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    SyncManager.getInstance().start();
    mockProcessQueue.mockClear();

    netInfoCallback({ isConnected: false, isInternetReachable: false });
    expect(mockProcessQueue).not.toHaveBeenCalled();

    netInfoCallback({ isConnected: true, isInternetReachable: true });
    expect(mockProcessQueue).toHaveBeenCalledTimes(1);
  });
});

describe("app foregrounding triggers sync", () => {
  it("triggers sync when app comes to foreground", () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    SyncManager.getInstance().start();
    netInfoCallback({ isConnected: true, isInternetReachable: true });
    mockProcessQueue.mockClear();

    appStateCallback("active");

    expect(mockProcessQueue).toHaveBeenCalledTimes(1);
  });
});

describe("periodic retry", () => {
  it("retries on interval when online", () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    SyncManager.getInstance().start();
    netInfoCallback({ isConnected: true, isInternetReachable: true });
    mockProcessQueue.mockClear();

    jest.advanceTimersByTime(60_000);

    expect(mockProcessQueue).toHaveBeenCalled();
  });
});

describe("connectivity recovery: missed online event", () => {
  // Manager starts offline with a queued item; connectivity then returns,
  // but the NetInfo listener event is never delivered (cached flag stays stale)
  async function startWithStaleOfflineFlag(): Promise<void> {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {},
    });

    mockNetInfoFetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    });
    SyncManager.getInstance().start();
    await jest.advanceTimersByTimeAsync(0);

    mockNetInfoFetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockProcessQueue.mockClear();
  }

  it("verifies real connectivity on the retry interval instead of trusting the cached flag", async () => {
    await startWithStaleOfflineFlag();

    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockProcessQueue).toHaveBeenCalled();
  });

  it("verifies real connectivity when the app comes to the foreground", async () => {
    await startWithStaleOfflineFlag();

    appStateCallback("active");
    await jest.advanceTimersByTimeAsync(0);

    expect(mockProcessQueue).toHaveBeenCalled();
  });
});

describe("processing mutex: production recovery", () => {
  it("resets the SyncService processing flag when the manager restarts", () => {
    const manager = SyncManager.getInstance();

    manager.start();
    manager.stop();
    manager.start();

    expect(mockResetProcessingFlag).toHaveBeenCalled();
  });
});

import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuthStore } from "@/store/authStore";
import { useSyncQueueStore } from "@/store/syncQueueStore";
import { SyncManager } from "./SyncManager";

const mockProcessQueue = jest.fn().mockResolvedValue(undefined);
jest.mock("./SyncService", () => ({
  processQueue: (...args: unknown[]) => mockProcessQueue(...args),
}));

jest.mock("./Logger", () => ({
  Logger: { logError: jest.fn() },
}));

let netInfoCallback: (state: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}) => void;
const mockNetInfoUnsubscribe = jest.fn();
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((cb: typeof netInfoCallback) => {
    netInfoCallback = cb;
    return mockNetInfoUnsubscribe;
  }),
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
  useAuthStore.getState().setAuth({ userId: "user-1", token: "tok" });
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

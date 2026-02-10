import { AppState, type NativeEventSubscription } from "react-native";
import NetInfo, {
  type NetInfoSubscription,
} from "@react-native-community/netinfo";
import { useAuthStore } from "@/store/authStore";
import { useSyncQueueStore } from "@/store/syncQueueStore";
import { processQueue } from "./SyncService";
import { Logger } from "./Logger";

const RETRY_INTERVAL_MS = 60_000;

class SyncManager {
  private static instance: SyncManager | null = null;

  private unsubscribeNetInfo: NetInfoSubscription | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;
  private retryIntervalId: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private online = false;

  private constructor() {}

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  get isStarted(): boolean {
    return this.started;
  }

  get isOnline(): boolean {
    return this.online;
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    useSyncQueueStore.getState().resetStaleItems();

    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const wasOffline = !this.online;
      this.online = !!(
        state.isConnected && state.isInternetReachable !== false
      );

      if (this.online && wasOffline) {
        this.triggerSync();
      }
    });

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          this.triggerSync();
        }
      },
    );

    this.retryIntervalId = setInterval(() => {
      if (this.online) {
        this.triggerSync();
      }
    }, RETRY_INTERVAL_MS);

    this.triggerSync();
  }

  stop(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = null;
    }

    this.started = false;
  }

  triggerSync(): void {
    if (!this.online) {
      return;
    }

    const auth = useAuthStore.getState().auth;
    if (!auth) {
      return;
    }

    const hasItems = useSyncQueueStore.getState().hasItemsToSync();
    if (!hasItems) {
      return;
    }

    processQueue().catch((error) => {
      Logger.logError(
        error instanceof Error ? error : new Error("Sync trigger failed"),
      );
    });
  }

  /** Reset instance for testing */
  static resetForTesting(): void {
    if (SyncManager.instance) {
      SyncManager.instance.stop();
      SyncManager.instance.online = false;
    }
    SyncManager.instance = null;
  }
}

export const syncManager = SyncManager.getInstance();

export { SyncManager };

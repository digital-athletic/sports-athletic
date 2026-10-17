import { AppState, type NativeEventSubscription } from "react-native";
import NetInfo, {
  type NetInfoSubscription,
} from "@react-native-community/netinfo";
import type {
  CompleteWorkoutType,
  UserExerciseDataType,
} from "@/schemas/sync.schema";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { useAuthStore } from "@/store/authStore";
import { useSyncQueueStore } from "@/store/syncQueueStore";
import { processQueue, resetProcessingFlag } from "./SyncService";
import { Logger } from "./Logger";

const RETRY_INTERVAL_MS = 60_000;

class SyncManager {
  private static instance: SyncManager | null = null;

  private unsubscribeNetInfo: NetInfoSubscription | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;
  private retryIntervalId: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private online = false;

  private onWorkoutCompleted: ((workout: CompleteWorkoutType) => void) | null =
    null;
  private onExerciseUpdated:
    | ((exerciseId: string, data: UserExerciseDataType) => void)
    | null = null;
  private onTestResultAdded: ((result: MaxValuesType) => void) | null = null;

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

    // A mutex wedged by a hung request must not outlive a manager restart
    resetProcessingFlag();

    this.registerHandlers();
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
          this.syncWithFreshConnectivity();
        }
      },
    );

    this.retryIntervalId = setInterval(() => {
      this.syncWithFreshConnectivity();
    }, RETRY_INTERVAL_MS);

    void this.checkConnectivityAndSync();
  }

  stop(): void {
    this.onWorkoutCompleted = null;
    this.onExerciseUpdated = null;
    this.onTestResultAdded = null;

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
    this.online = false;
  }

  notifyWorkoutCompleted(workout: CompleteWorkoutType): void {
    this.onWorkoutCompleted?.(workout);
  }

  notifyExerciseUpdated(exerciseId: string, data: UserExerciseDataType): void {
    this.onExerciseUpdated?.(exerciseId, data);
  }

  notifyTestResultAdded(result: MaxValuesType): void {
    this.onTestResultAdded?.(result);
  }

  private registerHandlers(): void {
    const enqueue = useSyncQueueStore.getState().enqueue;
    const currentUserId = () => useAuthStore.getState().auth?.userId ?? null;

    this.onWorkoutCompleted = (workout) => {
      enqueue({
        type: "COMPLETED_WORKOUT",
        referenceId: workout.id,
        payload: workout,
        ownerUserId: currentUserId(),
      });
      this.triggerSync();
    };

    this.onExerciseUpdated = (exerciseId, data) => {
      enqueue({
        type: "EXERCISE_DATA",
        referenceId: exerciseId,
        payload: data,
        ownerUserId: currentUserId(),
      });
      this.triggerSync();
    };

    this.onTestResultAdded = (result) => {
      enqueue({
        type: "STRENGTH_TEST",
        referenceId: `test-${result.testAt}`,
        payload: result,
        ownerUserId: currentUserId(),
      });
      this.triggerSync();
    };
  }

  // A missed NetInfo event leaves the cached flag stuck offline forever, so an
  // offline flag is re-verified against real connectivity before giving up
  private syncWithFreshConnectivity(): void {
    if (this.online) {
      this.triggerSync();
      return;
    }
    void this.checkConnectivityAndSync();
  }

  private async checkConnectivityAndSync(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      if (!this.started) {
        return;
      }
      this.online = !!(
        state.isConnected && state.isInternetReachable !== false
      );
      this.triggerSync();
    } catch (error) {
      Logger.logError(
        error instanceof Error ? error : new Error("Connectivity check failed"),
      );
    }
  }

  triggerSync(): void {
    if (!this.online) {
      return;
    }

    const auth = useAuthStore.getState().auth;
    if (!auth) {
      return;
    }

    const hasItems = useSyncQueueStore.getState().hasItemsToSync(auth.userId);
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

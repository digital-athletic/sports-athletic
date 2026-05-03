import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { featureFlags } from "@/config/featureFlags";
import { syncManager } from "./SyncManager";

/**
 * Hook to start/stop the SyncManager based on auth state.
 * Starts syncing when authenticated, stops when logged out.
 * Sync can be disabled entirely via EXPO_PUBLIC_SERVER_SYNC_ENABLED=false.
 */
export function useSyncManager() {
  const auth = useAuthStore((state) => state.auth);

  useEffect(() => {
    const shouldSync =
      auth !== null &&
      featureFlags.serverSyncEnabled &&
      !featureFlags.isReviewUserId(auth.userId);

    if (shouldSync) {
      syncManager.start();
    } else {
      syncManager.stop();
    }

    return () => {
      syncManager.stop();
    };
  }, [auth]);
}

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { syncManager } from "./SyncManager";

/**
 * Hook to start/stop the SyncManager based on auth state.
 * Starts syncing when authenticated, stops when logged out.
 */
export function useSyncManager() {
  const auth = useAuthStore((state) => state.auth);

  useEffect(() => {
    if (auth) {
      syncManager.start();
    } else {
      syncManager.stop();
    }

    return () => {
      syncManager.stop();
    };
  }, [auth]);
}

import { useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "@/services/supabaseClient";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to subscribe to Supabase auth state changes.
 * Updates authStore when session changes (login, logout, token refresh).
 * Silently refreshes session when device transitions from offline to online.
 */
export function useAuthStateListener() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const initializeFromSupabase = useAuthStore(
    (state) => state.initializeFromSupabase,
  );
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    // Initialize auth state from Supabase session on mount
    initializeFromSupabase();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          setAuth({
            userId: session.user.id,
            token: session.access_token,
          });
        }
      } else if (event === "SIGNED_OUT") {
        clearAuth();
      }
    });

    // Subscribe to network state changes — refresh session on reconnect
    // Per user decision: "silently refresh Supabase session when connectivity returns"
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = !!(
        state.isConnected && state.isInternetReachable !== false
      );
      if (isOnline && wasOfflineRef.current) {
        // Transitioned from offline to online — refresh session
        initializeFromSupabase();
      }
      wasOfflineRef.current = !isOnline;
    });

    // Cleanup subscriptions on unmount
    return () => {
      subscription.unsubscribe();
      unsubscribeNetInfo();
    };
  }, [setAuth, clearAuth, initializeFromSupabase]);
}

import { useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to subscribe to Supabase auth state changes.
 * Updates authStore when session changes (login, logout, token refresh).
 */
export function useAuthStateListener() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const initializeFromSupabase = useAuthStore(
    (state) => state.initializeFromSupabase,
  );

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

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, clearAuth, initializeFromSupabase]);
}

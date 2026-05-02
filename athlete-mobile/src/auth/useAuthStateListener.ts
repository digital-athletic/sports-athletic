import { useCallback, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "@/services/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import {
  useUserSettingsStore,
  type ConsentStatus,
} from "@/store/userSettingsStore";
import { fetchConsentFromProfile } from "@/services/AuthService";
import { featureFlags } from "@/config/featureFlags";

/**
 * Hook to subscribe to Supabase auth state changes.
 * Updates authStore when session changes (login, logout, token refresh).
 * Checks and caches consent status on sign-in; resets it on sign-out.
 * Silently refreshes session when device transitions from offline to online.
 */
export function useAuthStateListener() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const initializeFromSupabase = useAuthStore(
    (state) => state.initializeFromSupabase,
  );
  const auth = useAuthStore((state) => state.auth);
  const setConsentStatus = useUserSettingsStore(
    (state) => state.setConsentStatus,
  );
  const setAnonymisedDataUse = useUserSettingsStore(
    (state) => state.setAnonymisedDataUse,
  );
  const consentStatus = useUserSettingsStore((state) => state.consentStatus);

  const authRef = useRef(auth);
  authRef.current = auth;
  const consentStatusRef = useRef<ConsentStatus>(consentStatus);
  consentStatusRef.current = consentStatus;
  const wasOfflineRef = useRef(false);

  const checkAndSetConsent = useCallback(
    async (userId: string) => {
      if (consentStatusRef.current !== "loading") return;

      try {
        const record = await fetchConsentFromProfile(userId);
        const privacyMissing =
          featureFlags.privacyEnabled && record?.privacyAccepted !== true;
        const analyticsMissing =
          featureFlags.analyticsConsentEnabled &&
          record?.analyticsAccepted !== true;
        if (privacyMissing || analyticsMissing) {
          setConsentStatus("missing");
        } else {
          if (record?.analyticsAccepted !== undefined) {
            setAnonymisedDataUse(record.analyticsAccepted);
          }
          setConsentStatus("accepted");
        }
      } catch {
        // Fail open — prevent offline lockout
        setConsentStatus("accepted");
      }
    },
    [setConsentStatus, setAnonymisedDataUse],
  );

  useEffect(() => {
    initializeFromSupabase().then(() => {
      if (authRef.current) {
        checkAndSetConsent(authRef.current.userId);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          setAuth({
            userId: session.user.id,
            token: session.access_token,
          });
          if (event === "SIGNED_IN") {
            checkAndSetConsent(session.user.id);
          }
        }
      } else if (event === "SIGNED_OUT") {
        clearAuth();
        setConsentStatus("loading");
      }
    });

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = !!(
        state.isConnected && state.isInternetReachable !== false
      );
      if (isOnline && wasOfflineRef.current) {
        initializeFromSupabase();
      }
      wasOfflineRef.current = !isOnline;
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeNetInfo();
    };
  }, [
    setAuth,
    clearAuth,
    initializeFromSupabase,
    checkAndSetConsent,
    setConsentStatus,
  ]);
}

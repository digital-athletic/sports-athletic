import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
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
 * Checks and caches consent status on sign-in, app foreground, and reconnect.
 * Resets consent on sign-out.
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
  // Session-scoped: null on every cold start, so stale AsyncStorage "accepted"
  // from a different user cannot bypass the consent gate (GDPR re-verification).
  const lastVerifiedUserIdRef = useRef<string | null>(null);

  const checkAndSetConsent = useCallback(
    async (userId: string) => {
      if (featureFlags.isReviewUserId(userId)) {
        setConsentStatus("accepted");
        lastVerifiedUserIdRef.current = userId;
        return;
      }
      if (
        consentStatusRef.current === "accepted" &&
        lastVerifiedUserIdRef.current === userId
      ) {
        return;
      }

      try {
        const record = await fetchConsentFromProfile();
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
          lastVerifiedUserIdRef.current = userId;
        }
      } catch {
        // Fail closed — a network error must not bypass the consent gate.
        setConsentStatus("missing");
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
          });
          if (event === "SIGNED_IN") {
            checkAndSetConsent(session.user.id);
          }
        }
      } else if (event === "SIGNED_OUT") {
        clearAuth();
        setConsentStatus("loading");
        lastVerifiedUserIdRef.current = null;
      }
    });

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isOnline = !!(
        state.isConnected && state.isInternetReachable !== false
      );
      if (isOnline && wasOfflineRef.current) {
        // Re-check consent on reconnect for users blocked by a prior network
        // failure so the gate resolves automatically without requiring a
        // manual interaction or sign-out cycle.
        if (authRef.current && consentStatusRef.current !== "accepted") {
          checkAndSetConsent(authRef.current.userId);
        }
        initializeFromSupabase();
      }
      wasOfflineRef.current = !isOnline;
    });

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        nextState === "active" &&
        authRef.current &&
        consentStatusRef.current !== "accepted"
      ) {
        checkAndSetConsent(authRef.current.userId);
      }
    };
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.unsubscribe();
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, [
    setAuth,
    clearAuth,
    initializeFromSupabase,
    checkAndSetConsent,
    setConsentStatus,
  ]);
}

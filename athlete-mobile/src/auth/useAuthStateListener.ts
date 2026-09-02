import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "@/services/supabaseClient";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import {
  fetchConsentFromProfile,
  fetchDisplayName,
} from "@/services/AuthService";
import { useUserDataBackupStore } from "@/store/userDataBackupStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useRegistrationConsentStore } from "@/store/registrationConsentStore";
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
  const setConsentStatus = useUserSettingsStore(
    (state) => state.setConsentStatus,
  );
  const acceptConsent = useUserSettingsStore((state) => state.acceptConsent);
  const setAnonymisedDataUse = useUserSettingsStore(
    (state) => state.setAnonymisedDataUse,
  );
  const setUsername = useUserProfileStore((state) => state.setUsername);
  const restoreSnapshot = useUserDataBackupStore(
    (state) => state.restoreSnapshot,
  );

  const wasOfflineRef = useRef(false);
  // Session-scoped: null on every cold start, so stale AsyncStorage "accepted"
  // from a different user cannot bypass the consent gate (GDPR re-verification).
  const lastVerifiedUserIdRef = useRef<string | null>(null);
  const checkEpochRef = useRef(0);

  const syncDisplayName = useCallback(async () => {
    try {
      const name = await fetchDisplayName();
      if (name !== null) {
        setUsername(name);
      }
    } catch {
      // display name is non-critical — swallow silently
    }
  }, [setUsername]);

  const checkAndSetConsent = useCallback(
    async (userId: string) => {
      if (featureFlags.isReviewUserId(userId)) {
        setConsentStatus("accepted");
        return;
      }
      if (
        useUserSettingsStore.getState().consentStatus === "accepted" &&
        lastVerifiedUserIdRef.current === userId
      ) {
        return;
      }

      // Capture status before the async fetch to distinguish two "accepted" cases:
      //   a) stale from persistence (cold start or offline warm-logout) — server wins
      //   b) user accepted in-session while this check was in-flight — don't downgrade
      const statusBeforeFetch = useUserSettingsStore.getState().consentStatus;
      const epoch = ++checkEpochRef.current;
      // Returns true when an in-session accept must be preserved (case b above).
      const shouldPreserveInSessionAccept = () =>
        statusBeforeFetch !== "accepted" &&
        useUserSettingsStore.getState().consentStatus === "accepted";
      // Registration's saveConsentToProfile write resolves after this read and
      // owns the final accepted/missing outcome — skip downgrading here while
      // that write is still in flight, to avoid flashing ConsentScreen.
      const isRegistrationConsentSaveInFlight = () =>
        useRegistrationConsentStore.getState().pendingConsent !== null;

      try {
        const record = await fetchConsentFromProfile();
        if (checkEpochRef.current !== epoch) return;

        const privacyMissing =
          featureFlags.privacyEnabled && record?.privacyAccepted !== true;
        const analyticsMissing =
          featureFlags.analyticsConsentEnabled &&
          record?.analyticsAccepted !== true;
        if (privacyMissing || analyticsMissing) {
          if (shouldPreserveInSessionAccept()) return;
          if (isRegistrationConsentSaveInFlight()) return;
          setConsentStatus("missing");
        } else {
          // Defense-in-depth: verify the auth user hasn't changed since the fetch started.
          if (userId !== useAuthStore.getState().auth?.userId) return;
          setAnonymisedDataUse(record?.analyticsAccepted ?? false);
          acceptConsent();
          lastVerifiedUserIdRef.current = userId;
        }
      } catch (error: unknown) {
        if (checkEpochRef.current !== epoch) return;
        if (shouldPreserveInSessionAccept()) return;
        if (isRegistrationConsentSaveInFlight()) return;
        Logger.logError(
          error instanceof Error
            ? error
            : new Error("fetchConsentFromProfile failed"),
        );
        // Fail closed — a network error must not bypass the consent gate.
        setConsentStatus("missing");
      }
    },
    [setConsentStatus, acceptConsent, setAnonymisedDataUse],
  );

  useEffect(() => {
    initializeFromSupabase()
      .then(() => {
        const currentAuth = useAuthStore.getState().auth;
        if (currentAuth) {
          void Promise.all([
            checkAndSetConsent(currentAuth.userId),
            syncDisplayName(),
          ]);
        }
      })
      .catch(() => {
        // Initialization failure — consent gate remains in "loading";
        // the NetInfo reconnect handler will retry automatically.
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
            restoreSnapshot(session.user.id);
            const nameFromSession: unknown =
              session.user.user_metadata?.display_name;
            if (
              typeof nameFromSession === "string" &&
              nameFromSession.length > 0
            ) {
              setUsername(nameFromSession);
            }
            void checkAndSetConsent(session.user.id);
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
        // Mirror the mount path: initialize first, then re-check consent so that
        // a session established during the offline period is also covered.
        initializeFromSupabase()
          .then(() => {
            const currentAuth = useAuthStore.getState().auth;
            if (
              currentAuth &&
              useUserSettingsStore.getState().consentStatus !== "accepted"
            ) {
              checkAndSetConsent(currentAuth.userId);
            }
          })
          .catch(() => {});
      }
      wasOfflineRef.current = !isOnline;
    });

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const currentAuth = useAuthStore.getState().auth;
      if (
        nextState === "active" &&
        currentAuth &&
        useUserSettingsStore.getState().consentStatus !== "accepted"
      ) {
        checkAndSetConsent(currentAuth.userId);
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
    syncDisplayName,
    setConsentStatus,
    setUsername,
    restoreSnapshot,
  ]);
}

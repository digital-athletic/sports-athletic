import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "../services/supabaseClient";
import { Logger } from "../services/Logger";
import { useUserSettingsStore } from "./userSettingsStore";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { authStoreMigrations } from "./migrations/authStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

/**
 * Authentication data structure
 */
export interface AuthType {
  userId: string;
  token: string;
}

export type State = {
  auth: AuthType | null;
  isInitialized: boolean;
  _hasHydrated: boolean;
};

// Prefer factory function to avoid mutable references
const createInitialState = (): State => ({
  auth: null,
  isInitialized: false,
  _hasHydrated: false,
});

type Actions = {
  setAuth: (auth: AuthType | null) => void;
  clearAuth: () => void;
  initializeFromSupabase: () => Promise<void>;
  setHasHydrated: (hydrated: boolean) => void;
};

type Selectors = {
  isAuthenticated: () => boolean;
};

export type AuthState = State & Actions & Selectors;

/**
 * Authentication Store
 *
 * Manages user authentication state globally.
 * Persisted to AsyncStorage for session management.
 *
 * @example
 * ```tsx
 * const { auth, setAuth, clearAuth, isAuthenticated } = useAuthStore();
 *
 * // Login
 * setAuth({ userId: '123', token: 'abc...' });
 *
 * // Check auth status
 * if (isAuthenticated()) {
 *   // Navigate to protected route
 * }
 *
 * // Logout
 * clearAuth();
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),

      setAuth: (auth) =>
        set((state) => {
          state.auth = auth;
        }),

      clearAuth: () =>
        set((state) => {
          state.auth = null;
          // Keep isInitialized true - the store is still initialized, just without auth
        }),

      initializeFromSupabase: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          set((state) => {
            if (session) {
              state.auth = {
                userId: session.user.id,
                token: session.access_token,
              };
            } else {
              state.auth = null;
            }
            state.isInitialized = true;
          });
          if (session) {
            try {
              const { data: profile } = await supabase
                .from("user_profiles")
                .select("consent_health_accepted")
                .eq("user_id", session.user.id)
                .maybeSingle();
              if (
                profile?.consent_health_accepted !== undefined &&
                profile?.consent_health_accepted !== null
              ) {
                useUserSettingsStore
                  .getState()
                  .setAnonymisedDataUse(profile.consent_health_accepted);
              }
            } catch {
              // Non-fatal: consent sync failure should not block auth initialization
            }
          }
        } catch {
          // Network unavailable — preserve persisted auth, mark initialized
          Logger.logError(
            new Error("initializeFromSupabase: offline, using persisted auth"),
          );
          set((state) => {
            state.isInitialized = true;
          });
        }
      },

      isAuthenticated: () => get().auth !== null,

      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),
    })),
    {
      name: "auth-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.AUTH,
      migrate: createMigrate(
        STORE_VERSIONS.AUTH,
        authStoreMigrations,
        createInitialState,
        "auth",
      ),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating auth store:", error);
        }
        // Always mark as hydrated, even if there was an error
        // This prevents the app from being stuck in loading state
        useAuthStore.getState().setHasHydrated(true);
      },
    },
  ),
);

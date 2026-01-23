import { SharedConstants } from "@/constants/sharedConstants";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "../services/supabaseClient";
import { asyncStorage } from "./middleware";

/**
 * Authentication data structure
 */
export interface AuthType {
  userId: string;
  token: string;
}

type State = {
  auth: AuthType | null;
  isInitialized: boolean;
};

// Prefer factory function to avoid mutable references
const createInitialState = (): State => ({
  auth: null,
  isInitialized: false,
});

type Actions = {
  setAuth: (auth: AuthType | null) => void;
  clearAuth: () => void;
  initializeFromSupabase: () => Promise<void>;
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
          const initialState = createInitialState();
          state.auth = initialState.auth;
          state.isInitialized = initialState.isInitialized;
        }),

      initializeFromSupabase: async () => {
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
      },

      isAuthenticated: () => get().auth !== null,
    })),
    {
      name: "auth-storage",
      storage: asyncStorage,
      version: SharedConstants.PERSIST_VERSION,
      // Migration strategy: Reset to default state on version mismatch
      // This prevents errors from incompatible persisted data after updates
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);

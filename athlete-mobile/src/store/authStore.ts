import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { supabase } from "../services/supabaseClient";

/**
 * Authentication data structure
 */
export interface AuthType {
  userId: string;
  token: string;
}

export interface AuthState {
  auth: AuthType | null;
  isInitialized: boolean;

  // Actions
  setAuth: (auth: AuthType | null) => void;
  clearAuth: () => void;
  initializeFromSupabase: () => Promise<void>;

  // Selectors
  isAuthenticated: () => boolean;
}

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
      auth: null,
      isInitialized: false,

      setAuth: (auth) =>
        set((state) => {
          state.auth = auth;
        }),

      clearAuth: () =>
        set((state) => {
          state.auth = null;
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
    },
  ),
);

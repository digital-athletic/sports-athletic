import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

/**
 * Authentication data structure
 * Note: Removed 'provider' field as Facebook/Google login is being deprecated
 */
export interface AuthType {
  userId: string;
  token: string;
}

export interface AuthState {
  auth: AuthType | null;

  // Actions
  setAuth: (auth: AuthType | null) => void;
  clearAuth: () => void;

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

      setAuth: (auth) =>
        set((state) => {
          state.auth = auth;
        }),

      clearAuth: () =>
        set((state) => {
          state.auth = null;
        }),

      isAuthenticated: () => get().auth !== null,
    })),
    {
      name: "auth-storage",
      storage: asyncStorage,
    }
  )
);

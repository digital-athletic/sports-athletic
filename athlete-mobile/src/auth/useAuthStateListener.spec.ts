/**
 * Unit tests for useAuthStateListener offline reconnect behavior
 */

/* eslint-disable import/first */
const mockUnsubscribeSupabase = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribeSupabase } },
}));
jest.mock("../services/supabaseClient", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: Parameters<typeof mockOnAuthStateChange>) =>
        mockOnAuthStateChange(...args),
    },
  },
}));

const mockUnsubscribeNetInfo = jest.fn();
let capturedNetInfoListener:
  | ((state: {
      isConnected: boolean | null;
      isInternetReachable: boolean | null;
    }) => void)
  | null = null;
jest.mock("@react-native-community/netinfo", () => {
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((listener) => {
        capturedNetInfoListener = listener;
        return mockUnsubscribeNetInfo;
      }),
      fetch: jest.fn().mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      }),
    },
  };
});

const mockSetAuth = jest.fn();
const mockClearAuth = jest.fn();
const mockInitializeFromSupabase = jest.fn();
jest.mock("../store/authStore", () => ({
  useAuthStore: (
    selector: (state: {
      setAuth: typeof mockSetAuth;
      clearAuth: typeof mockClearAuth;
      initializeFromSupabase: typeof mockInitializeFromSupabase;
    }) => unknown,
  ) =>
    selector({
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
      initializeFromSupabase: mockInitializeFromSupabase,
    }),
}));

import { renderHook } from "@testing-library/react-native";
import { useAuthStateListener } from "./useAuthStateListener";

beforeEach(() => {
  jest.clearAllMocks();
  capturedNetInfoListener = null;
});

describe("useAuthStateListener", () => {
  it("calls initializeFromSupabase on mount", () => {
    renderHook(() => useAuthStateListener());

    expect(mockInitializeFromSupabase).toHaveBeenCalledTimes(1);
  });

  it("calls initializeFromSupabase when NetInfo transitions from offline to online", () => {
    renderHook(() => useAuthStateListener());
    mockInitializeFromSupabase.mockClear();

    // Simulate offline state
    capturedNetInfoListener!({
      isConnected: false,
      isInternetReachable: false,
    });
    // Simulate online state (transition)
    capturedNetInfoListener!({ isConnected: true, isInternetReachable: true });

    expect(mockInitializeFromSupabase).toHaveBeenCalledTimes(1);
  });

  it("does NOT call initializeFromSupabase when already online and receiving another online event", () => {
    renderHook(() => useAuthStateListener());
    mockInitializeFromSupabase.mockClear();

    // Already online twice in a row — no transition
    capturedNetInfoListener!({ isConnected: true, isInternetReachable: true });
    capturedNetInfoListener!({ isConnected: true, isInternetReachable: true });

    expect(mockInitializeFromSupabase).not.toHaveBeenCalled();
  });

  it("unsubscribes both Supabase and NetInfo listeners on unmount", () => {
    const { unmount } = renderHook(() => useAuthStateListener());

    unmount();

    expect(mockUnsubscribeSupabase).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeNetInfo).toHaveBeenCalledTimes(1);
  });
});

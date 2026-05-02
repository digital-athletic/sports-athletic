/**
 * Unit tests for useAuthStateListener
 */

import { renderHook, waitFor } from "@testing-library/react-native";
import { useAuthStateListener } from "./useAuthStateListener";

const mockUnsubscribeSupabase = jest.fn();
let capturedAuthCallback:
  | ((
      event: string,
      session: { user: { id: string }; access_token: string } | null,
    ) => void)
  | null = null;
const mockOnAuthStateChange = jest.fn(
  (
    callback: (
      event: string,
      session: { user: { id: string }; access_token: string } | null,
    ) => void,
  ) => {
    capturedAuthCallback = callback;
    return { data: { subscription: { unsubscribe: mockUnsubscribeSupabase } } };
  },
);
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
const mockInitializeFromSupabase = jest.fn(() => Promise.resolve());
let mockAuthValue: { userId: string; token: string } | null = null;
jest.mock("../store/authStore", () => ({
  useAuthStore: (
    selector: (state: {
      setAuth: typeof mockSetAuth;
      clearAuth: typeof mockClearAuth;
      initializeFromSupabase: typeof mockInitializeFromSupabase;
      auth: typeof mockAuthValue;
    }) => unknown,
  ) =>
    selector({
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
      initializeFromSupabase: mockInitializeFromSupabase,
      get auth() {
        return mockAuthValue;
      },
    }),
}));

const mockSetConsentStatus = jest.fn();
const mockSetAnonymisedDataUse = jest.fn();
let mockConsentStatus: "loading" | "accepted" | "missing" = "loading";
jest.mock("../store/userSettingsStore", () => ({
  useUserSettingsStore: (
    selector: (state: {
      setConsentStatus: typeof mockSetConsentStatus;
      setAnonymisedDataUse: typeof mockSetAnonymisedDataUse;
      consentStatus: typeof mockConsentStatus;
    }) => unknown,
  ) =>
    selector({
      setConsentStatus: mockSetConsentStatus,
      setAnonymisedDataUse: mockSetAnonymisedDataUse,
      get consentStatus() {
        return mockConsentStatus;
      },
    }),
}));

const mockFetchConsentFromProfile = jest.fn();
jest.mock("../services/AuthService", () => ({
  fetchConsentFromProfile: (...args: unknown[]) =>
    mockFetchConsentFromProfile(...args),
}));

let mockPrivacyEnabled = true;
let mockAnalyticsConsentEnabled = true;
jest.mock("../config/featureFlags", () => ({
  featureFlags: {
    get privacyEnabled() {
      return mockPrivacyEnabled;
    },
    get analyticsConsentEnabled() {
      return mockAnalyticsConsentEnabled;
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  capturedAuthCallback = null;
  capturedNetInfoListener = null;
  mockPrivacyEnabled = true;
  mockAnalyticsConsentEnabled = true;
  mockInitializeFromSupabase.mockReturnValue(Promise.resolve());
  mockAuthValue = null;
  mockConsentStatus = "loading";
});

describe("useAuthStateListener", () => {
  it("calls initializeFromSupabase on mount", () => {
    renderHook(() => useAuthStateListener());

    expect(mockInitializeFromSupabase).toHaveBeenCalledTimes(1);
  });

  it("calls initializeFromSupabase when NetInfo transitions from offline to online", () => {
    renderHook(() => useAuthStateListener());
    mockInitializeFromSupabase.mockClear();

    capturedNetInfoListener!({
      isConnected: false,
      isInternetReachable: false,
    });
    capturedNetInfoListener!({ isConnected: true, isInternetReachable: true });

    expect(mockInitializeFromSupabase).toHaveBeenCalledTimes(1);
  });

  it("does NOT call initializeFromSupabase when already online and receiving another online event", () => {
    renderHook(() => useAuthStateListener());
    mockInitializeFromSupabase.mockClear();

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

describe("useAuthStateListener — consent gate", () => {
  it("calls checkAndSetConsent after init when auth is present", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("does not fetch consent after init when no auth", async () => {
    mockAuthValue = null;

    renderHook(() => useAuthStateListener());

    await Promise.resolve();

    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("does not fetch if consentStatus is already accepted", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockConsentStatus = "accepted";

    renderHook(() => useAuthStateListener());

    await Promise.resolve();

    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("does not fetch if consentStatus is already missing", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockConsentStatus = "missing";

    renderHook(() => useAuthStateListener());

    await Promise.resolve();

    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("sets consentStatus to missing when no profile row exists", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("missing");
    });
  });

  it("sets consentStatus to missing when privacyAccepted is false", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: false,
      analyticsAccepted: false,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("missing");
    });
  });

  it("syncs analyticsAccepted to store when privacy is accepted", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("sets consentStatus to missing when analyticsAccepted is false", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: false,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("missing");
    });
  });

  it("sets consentStatus to accepted when analyticsConsentEnabled is false regardless of analyticsAccepted", async () => {
    mockAnalyticsConsentEnabled = false;
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: false,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("sets consentStatus to accepted when both privacyEnabled and analyticsConsentEnabled are false", async () => {
    mockPrivacyEnabled = false;
    mockAnalyticsConsentEnabled = false;
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("sets consentStatus to accepted if fetch throws (fail-open offline lockout prevention)", async () => {
    mockAuthValue = { userId: "user-1", token: "token" };
    mockFetchConsentFromProfile.mockRejectedValue(new Error("Network error"));

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("calls checkAndSetConsent with userId on SIGNED_IN", async () => {
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    capturedAuthCallback!("SIGNED_IN", {
      user: { id: "user-2" },
      access_token: "token-2",
    });

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalledWith("user-2");
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("does not call checkAndSetConsent on TOKEN_REFRESHED", async () => {
    renderHook(() => useAuthStateListener());

    capturedAuthCallback!("TOKEN_REFRESHED", {
      user: { id: "user-1" },
      access_token: "new-token",
    });

    await Promise.resolve();

    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("resets consentStatus to loading and clears auth on SIGNED_OUT", () => {
    renderHook(() => useAuthStateListener());

    capturedAuthCallback!("SIGNED_OUT", null);

    expect(mockClearAuth).toHaveBeenCalledTimes(1);
    expect(mockSetConsentStatus).toHaveBeenCalledWith("loading");
  });
});

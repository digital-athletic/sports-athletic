/**
 * Unit tests for useAuthStateListener
 */

import { renderHook, waitFor } from "@testing-library/react-native";
import { type AppStateStatus } from "react-native";
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

const mockAppStateRemove = jest.fn();
let capturedAppStateListener: ((state: AppStateStatus) => void) | null = null;
jest.mock("react-native", () => ({
  AppState: {
    addEventListener: jest.fn(
      (event: string, listener: (state: AppStateStatus) => void) => {
        capturedAppStateListener = listener;
        return { remove: mockAppStateRemove };
      },
    ),
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
let mockAuthValue: { userId: string } | null = null;
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
let mockIsReviewUserId = false;
jest.mock("../config/featureFlags", () => ({
  featureFlags: {
    get privacyEnabled() {
      return mockPrivacyEnabled;
    },
    get analyticsConsentEnabled() {
      return mockAnalyticsConsentEnabled;
    },
    isReviewUserId: (_userId: string) => mockIsReviewUserId,
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  capturedAuthCallback = null;
  capturedNetInfoListener = null;
  capturedAppStateListener = null;
  mockPrivacyEnabled = true;
  mockAnalyticsConsentEnabled = true;
  mockIsReviewUserId = false;
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

  it("unsubscribes Supabase, NetInfo, and AppState listeners on unmount", () => {
    const { unmount } = renderHook(() => useAuthStateListener());

    unmount();

    expect(mockUnsubscribeSupabase).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribeNetInfo).toHaveBeenCalledTimes(1);
    expect(mockAppStateRemove).toHaveBeenCalledTimes(1);
  });
});

describe("useAuthStateListener — consent gate", () => {
  it("calls checkAndSetConsent after init when auth is present", async () => {
    mockAuthValue = { userId: "user-1" };
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

  it("always fetches from server on startup even when consentStatus is cached as accepted — GDPR re-verification", async () => {
    // consentStatus "accepted" may belong to a different user (force-quit scenario).
    // lastVerifiedUserIdRef is null on cold start, so the guard never fires and
    // we always do one server round-trip to verify consent for the current user.
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "accepted";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
  });

  it("re-fetches consent when consentStatus is missing (allows retry for previously-failed checks)", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
  });

  it("sets consentStatus to missing when no profile row exists", async () => {
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("missing");
    });
  });

  it("sets consentStatus to missing when privacyAccepted is false", async () => {
    mockAuthValue = { userId: "user-1" };
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
    mockAuthValue = { userId: "user-1" };
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
    mockAuthValue = { userId: "user-1" };
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
    mockAuthValue = { userId: "user-1" };
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
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("sets consentStatus to missing if fetch throws (fail closed — consent is a hard blocker)", async () => {
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockRejectedValue(new Error("Network error"));

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("missing");
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
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
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

  it("re-checks consent when app foregrounds with status missing", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalledTimes(1);
    });
    mockFetchConsentFromProfile.mockClear();

    capturedAppStateListener!("active");

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
  });

  it("does not re-check consent on foreground when status is already accepted", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "accepted";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());
    // Startup always fetches once (lastVerifiedUserIdRef is null on cold start).
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalledTimes(1);
    });
    mockFetchConsentFromProfile.mockClear();

    // After startup verification, the AppState guard (consentStatus !== "accepted")
    // prevents a second call when the user foregrounds with accepted status.
    capturedAppStateListener!("active");

    await Promise.resolve();
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("does not re-check consent on foreground when no auth", async () => {
    mockAuthValue = null;
    mockConsentStatus = "missing";

    renderHook(() => useAuthStateListener());
    await Promise.resolve();

    capturedAppStateListener!("active");

    await Promise.resolve();
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("does not re-check consent when app transitions to background", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";
    mockFetchConsentFromProfile.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalledTimes(1);
    });
    mockFetchConsentFromProfile.mockClear();

    capturedAppStateListener!("background");

    await Promise.resolve();
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("re-checks consent on reconnect when status is missing", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalledTimes(1);
    });
    mockFetchConsentFromProfile.mockClear();
    mockSetConsentStatus.mockClear();

    capturedNetInfoListener!({
      isConnected: false,
      isInternetReachable: false,
    });
    capturedNetInfoListener!({ isConnected: true, isInternetReachable: true });

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
  });

  it("does not re-check consent on reconnect when status is already accepted", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "accepted";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());
    // Startup always fetches once (lastVerifiedUserIdRef is null on cold start).
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalledTimes(1);
    });
    mockFetchConsentFromProfile.mockClear();

    // After startup verification, the NetInfo guard (consentStatus !== "accepted")
    // prevents a second call when connectivity is restored with accepted status.
    capturedNetInfoListener!({
      isConnected: false,
      isInternetReachable: false,
    });
    capturedNetInfoListener!({ isConnected: true, isInternetReachable: true });

    await Promise.resolve();
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("skips the server round-trip on SIGNED_IN for the same user after a successful startup check in this session", async () => {
    // consentStatus starts as "accepted" so consentStatusRef.current initialises
    // to "accepted" on first render. The startup check still runs (lastVerifiedUserIdRef
    // is null) and sets lastVerifiedUserIdRef to "user-1" after verifying.
    // A subsequent SIGNED_IN for the same user then hits both guard conditions
    // (consentStatus=accepted AND verifiedUserId=user-1) and skips the fetch.
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "accepted";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    // Wait for the mandatory cold-start check (lastVerifiedUserIdRef was null)
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
    mockFetchConsentFromProfile.mockClear();

    // Second SIGNED_IN for the same user — guard fires, no second fetch.
    capturedAuthCallback!("SIGNED_IN", {
      user: { id: "user-1" },
      access_token: "token-refreshed",
    });

    await Promise.resolve();
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  it("always re-fetches on SIGNED_IN when a different userId appears — GDPR cross-user protection", async () => {
    // User A's consent was verified at startup. A different user then signs in
    // (e.g. on a shared device). lastVerifiedUserIdRef is "user-a", not "user-b",
    // so the guard doesn't fire and a server re-check is mandatory.
    mockAuthValue = { userId: "user-a" };
    mockConsentStatus = "accepted";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    // Wait for startup check to verify user-a and set lastVerifiedUserIdRef
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
    mockFetchConsentFromProfile.mockClear();

    // Different user signs in — lastVerifiedUserIdRef is "user-a", not "user-b"
    capturedAuthCallback!("SIGNED_IN", {
      user: { id: "user-b" },
      access_token: "token-b",
    });

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
  });

  it("re-fetches consent for a new user when SIGNED_OUT never fired — offline warm-logout scenario", async () => {
    // Scenario: User A taps "Logout" while offline. clearAuth() runs locally but
    // Supabase never emits SIGNED_OUT, so lastVerifiedUserIdRef stays "user-a"
    // and consentStatus stays "accepted" in the store. User B then signs in on
    // the same device. The guard's userId check ("user-a" !== "user-b") fails,
    // so a server re-check runs for User B regardless of the cached status.
    mockAuthValue = { userId: "user-a" };
    mockConsentStatus = "accepted";
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    // Cold-start check verifies user-a and sets lastVerifiedUserIdRef = "user-a".
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
    mockFetchConsentFromProfile.mockClear();

    // Offline logout: SIGNED_OUT never fires. consentStatus remains "accepted",
    // lastVerifiedUserIdRef remains "user-a". No state is reset by the listener.

    // User B signs in — SIGNED_IN fires with a different userId.
    capturedAuthCallback!("SIGNED_IN", {
      user: { id: "user-b" },
      access_token: "token-b",
    });

    // lastVerifiedUserIdRef ("user-a") !== "user-b", so the guard does not skip.
    // Consent must be re-verified server-side for User B.
    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
  });

  it("sets consentStatus to accepted without fetching for review user", async () => {
    mockIsReviewUserId = true;
    mockAuthValue = { userId: "review-user" };

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });
});

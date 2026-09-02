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
      session: {
        user: { id: string; user_metadata?: Record<string, unknown> };
        access_token: string;
      } | null,
    ) => void)
  | null = null;
const mockOnAuthStateChange = jest.fn(
  (
    callback: (
      event: string,
      session: {
        user: { id: string; user_metadata?: Record<string, unknown> };
        access_token: string;
      } | null,
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

// mockSetAuth updates mockAuthValue so getState().auth mirrors the real store
// behavior (SIGNED_IN sets auth before checkAndSetConsent's cross-user guard runs).
const mockSetAuth = jest.fn((auth: { userId: string }) => {
  mockAuthValue = auth;
});
const mockClearAuth = jest.fn();
const mockInitializeFromSupabase = jest.fn(() => Promise.resolve());
let mockAuthValue: { userId: string } | null = null;
// Controls useAuthStore.getState().auth independently from mockAuthValue.
// undefined (default) = mirror mockAuthValue, so most tests work unchanged.
// null | object      = use this value directly (R5 test only).
let mockGetStateAuth: { userId: string } | null | undefined = undefined;
jest.mock("../store/authStore", () => ({
  useAuthStore: Object.assign(
    (
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
    {
      getState: () => ({
        get auth() {
          // undefined = mirror mockAuthValue; explicit null/object = independent
          return mockGetStateAuth !== undefined
            ? mockGetStateAuth
            : mockAuthValue;
        },
      }),
    },
  ),
}));

const mockSetConsentStatus = jest.fn();
const mockSetAnonymisedDataUse = jest.fn();
const mockAcceptConsent = jest.fn();
let mockConsentStatus: "loading" | "accepted" | "missing" = "loading";
jest.mock("../store/userSettingsStore", () => ({
  useUserSettingsStore: Object.assign(
    (
      selector: (state: {
        setConsentStatus: typeof mockSetConsentStatus;
        setAnonymisedDataUse: typeof mockSetAnonymisedDataUse;
        acceptConsent: typeof mockAcceptConsent;
      }) => unknown,
    ) =>
      selector({
        setConsentStatus: mockSetConsentStatus,
        setAnonymisedDataUse: mockSetAnonymisedDataUse,
        acceptConsent: mockAcceptConsent,
      }),
    {
      getState: () => ({
        get consentStatus() {
          return mockConsentStatus;
        },
      }),
    },
  ),
}));

const mockFetchConsentFromProfile = jest.fn();
const mockFetchDisplayName = jest.fn();
jest.mock("../services/AuthService", () => ({
  fetchConsentFromProfile: (...args: unknown[]) =>
    mockFetchConsentFromProfile(...args),
  fetchDisplayName: (...args: unknown[]) => mockFetchDisplayName(...args),
}));

const mockSetUsername = jest.fn();
jest.mock("../store/userProfileStore", () => ({
  useUserProfileStore: (
    selector: (state: { setUsername: typeof mockSetUsername }) => unknown,
  ) => selector({ setUsername: mockSetUsername }),
}));

const mockRestoreSnapshot = jest.fn();
jest.mock("../store/userDataBackupStore", () => ({
  useUserDataBackupStore: (
    selector: (state: {
      restoreSnapshot: typeof mockRestoreSnapshot;
    }) => unknown,
  ) => selector({ restoreSnapshot: mockRestoreSnapshot }),
}));

let mockPendingConsent: {
  analyticsAccepted: boolean;
  termsAccepted: boolean;
} | null = null;
jest.mock("../store/registrationConsentStore", () => ({
  useRegistrationConsentStore: {
    getState: () => ({
      get pendingConsent() {
        return mockPendingConsent;
      },
    }),
  },
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
  mockPendingConsent = null;
  mockInitializeFromSupabase.mockReturnValue(Promise.resolve());
  mockAuthValue = null;
  mockGetStateAuth = undefined; // mirror mode: getState().auth tracks mockAuthValue
  mockConsentStatus = "loading";
  mockFetchDisplayName.mockResolvedValue(null);
  mockSetUsername.mockReset();
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
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
      expect(mockAcceptConsent).toHaveBeenCalled();
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
      expect(mockAcceptConsent).toHaveBeenCalled();
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
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(false);
      expect(mockAcceptConsent).toHaveBeenCalled();
    });
  });

  it("sets consentStatus to accepted when both privacyEnabled and analyticsConsentEnabled are false", async () => {
    mockPrivacyEnabled = false;
    mockAnalyticsConsentEnabled = false;
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(false);
      expect(mockAcceptConsent).toHaveBeenCalled();
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
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
      expect(mockAcceptConsent).toHaveBeenCalled();
    });
  });

  it("does not call checkAndSetConsent on TOKEN_REFRESHED", async () => {
    renderHook(() => useAuthStateListener());
    // Let the init .then() settle first (init finds no user → no consent check).
    // TOKEN_REFRESHED fires after, mirroring real Supabase event ordering.
    await Promise.resolve();

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
      expect(mockSetAnonymisedDataUse).toHaveBeenCalledWith(true);
      expect(mockAcceptConsent).toHaveBeenCalled();
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

  it("bypasses consent fetch for review user and marks consent accepted", async () => {
    mockIsReviewUserId = true;
    mockAuthValue = { userId: "review-user" };

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockSetConsentStatus).toHaveBeenCalledWith("accepted");
    });
    expect(mockAcceptConsent).not.toHaveBeenCalled();
    expect(mockFetchConsentFromProfile).not.toHaveBeenCalled();
  });

  // R1 — epoch deduplication
  it("drops a stale consent check result when a newer check starts and resolves first", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";

    let resolvePromise1!: (value: {
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }) => void;
    let resolvePromise2!: (value: {
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }) => void;
    const promise1 = new Promise<{
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }>((resolve) => {
      resolvePromise1 = resolve;
    });
    const promise2 = new Promise<{
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }>((resolve) => {
      resolvePromise2 = resolve;
    });

    mockFetchConsentFromProfile
      .mockReturnValueOnce(promise1)
      .mockReturnValueOnce(promise2);

    // epoch 1: mount triggers first check
    renderHook(() => useAuthStateListener());
    await Promise.resolve();
    await Promise.resolve();

    // epoch 2: AppState foreground triggers second check
    capturedAppStateListener!("active");
    await Promise.resolve();
    await Promise.resolve();

    // Resolve second (newer) fetch first — epoch 2 result is valid
    resolvePromise2({ privacyAccepted: true, analyticsAccepted: true });
    await waitFor(() => expect(mockAcceptConsent).toHaveBeenCalled());

    mockAcceptConsent.mockClear();
    mockSetConsentStatus.mockClear();

    // Resolve first (stale) fetch — epoch 1 result must be dropped
    resolvePromise1({ privacyAccepted: false, analyticsAccepted: false });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("missing");
    expect(mockAcceptConsent).not.toHaveBeenCalled();
  });

  // R2 — sticky accepted
  it("does not downgrade consentStatus from accepted to missing when a background re-check resolves after a local accept", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";

    let resolvePromise!: (value: {
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }) => void;
    const promise = new Promise<{
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }>((resolve) => {
      resolvePromise = resolve;
    });

    mockFetchConsentFromProfile.mockReturnValueOnce(promise);

    // Mount: init check starts (in flight)
    renderHook(() => useAuthStateListener());
    await Promise.resolve();
    await Promise.resolve();

    // Simulate local accept while the fetch is still in flight.
    // The sticky guard reads useUserSettingsStore.getState().consentStatus directly,
    // so a re-render is not needed — updating mockConsentStatus is sufficient.
    mockConsentStatus = "accepted";

    // Now the stale fetch resolves with "missing" data
    resolvePromise({ privacyAccepted: false, analyticsAccepted: false });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // The sticky guard must prevent overwriting "accepted" with "missing"
    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("missing");
  });

  // R3 — registration consent-save in flight
  it("does not set consentStatus to missing when a registration consent save is in flight", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "loading";
    mockPendingConsent = { analyticsAccepted: true, termsAccepted: true };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: false,
      analyticsAccepted: false,
    });

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
    await Promise.resolve();

    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("missing");
  });

  // R3-catch — registration consent-save in flight, background fetch throws
  it("does not set consentStatus to missing on fetch error when a registration consent save is in flight", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "loading";
    mockPendingConsent = { analyticsAccepted: true, termsAccepted: true };
    mockFetchConsentFromProfile.mockRejectedValue(new Error("network"));

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockFetchConsentFromProfile).toHaveBeenCalled();
    });
    await Promise.resolve();

    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("missing");
  });

  // R1-catch — epoch dedup on the error path
  it("drops a stale consent check error when a newer check has already resolved", async () => {
    mockAuthValue = { userId: "user-1" };
    mockConsentStatus = "missing";

    let rejectPromise1!: (err: Error) => void;
    let resolvePromise2!: (value: {
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }) => void;
    const promise1 = new Promise<{
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }>((_, reject) => {
      rejectPromise1 = reject;
    });
    const promise2 = new Promise<{
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }>((resolve) => {
      resolvePromise2 = resolve;
    });

    mockFetchConsentFromProfile
      .mockReturnValueOnce(promise1)
      .mockReturnValueOnce(promise2);

    // epoch 1: mount triggers first check
    renderHook(() => useAuthStateListener());
    await Promise.resolve();
    await Promise.resolve();

    // epoch 2: AppState foreground triggers second check
    capturedAppStateListener!("active");
    await Promise.resolve();
    await Promise.resolve();

    // Resolve second (newer) fetch first — epoch 2 result is valid
    resolvePromise2({ privacyAccepted: true, analyticsAccepted: true });
    await waitFor(() => expect(mockAcceptConsent).toHaveBeenCalled());

    mockAcceptConsent.mockClear();
    mockSetConsentStatus.mockClear();

    // Reject first (stale) fetch — epoch 1 error must be silently dropped
    rejectPromise1(new Error("network"));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSetConsentStatus).not.toHaveBeenCalledWith("missing");
    expect(mockAcceptConsent).not.toHaveBeenCalled();
  });

  // Cross-user guard — userId mismatch between fetch start and result
  it("does not apply a consent result for a user who signed out before the fetch resolved", async () => {
    mockAuthValue = { userId: "user-a" };
    mockConsentStatus = "missing";

    let resolvePromise!: (value: {
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }) => void;
    const promise = new Promise<{
      privacyAccepted: boolean;
      analyticsAccepted: boolean;
    }>((resolve) => {
      resolvePromise = resolve;
    });

    mockFetchConsentFromProfile.mockReturnValueOnce(promise);

    renderHook(() => useAuthStateListener());
    await Promise.resolve();
    await Promise.resolve();

    // User signs out while fetch is in flight — store auth becomes null
    mockGetStateAuth = null;

    // Fetch resolves with accepted data for the now-signed-out user
    resolvePromise({ privacyAccepted: true, analyticsAccepted: true });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Cross-user guard must prevent acceptConsent from firing for the wrong user
    expect(mockAcceptConsent).not.toHaveBeenCalled();
  });

  // R5 — fresh auth from store.getState() after init
  it("reads post-init auth from store.getState() rather than the stale pre-init ref", async () => {
    // Set mockGetStateAuth to null (not undefined) to activate independent mode:
    // getState().auth uses mockGetStateAuth while authRef.current tracks mockAuthValue.
    // Both start null, but only getState() sees the post-init update.
    mockAuthValue = null; // hook renders with null → authRef.current = null
    mockGetStateAuth = null; // getState().auth starts null too (independent mode)

    mockInitializeFromSupabase.mockImplementation(async () => {
      // Mutates only the getState() path — no React re-render fires,
      // so authRef.current stays null throughout the .then() callback.
      mockGetStateAuth = { userId: "user-1" };
    });
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    // Fails if the implementation reads authRef.current (null — no re-render).
    // Passes only when it calls useAuthStore.getState().auth (returns mockGetStateAuth).
    await waitFor(() => expect(mockFetchConsentFromProfile).toHaveBeenCalled());
  });
});

describe("useAuthStateListener — display name sync", () => {
  it("fetches display name and sets it in the store on cold start when auth is present", async () => {
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });
    mockFetchDisplayName.mockResolvedValue("Alice");

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockFetchDisplayName).toHaveBeenCalled();
      expect(mockSetUsername).toHaveBeenCalledWith("Alice");
    });
  });

  it("calls restoreSnapshot with userId on SIGNED_IN", () => {
    renderHook(() => useAuthStateListener());

    capturedAuthCallback!("SIGNED_IN", {
      user: { id: "user-1" },
      access_token: "token",
    });

    expect(mockRestoreSnapshot).toHaveBeenCalledWith("user-1");
  });

  it("reads display name from session metadata and sets it in the store on SIGNED_IN", async () => {
    // Independent mode: cold start finds no auth so it never calls syncDisplayName,
    // keeping this test focused solely on the SIGNED_IN code path.
    mockGetStateAuth = null;
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    renderHook(() => useAuthStateListener());

    capturedAuthCallback!("SIGNED_IN", {
      user: { id: "user-1", user_metadata: { display_name: "Bob" } },
      access_token: "token",
    });

    await waitFor(() => {
      expect(mockSetUsername).toHaveBeenCalledWith("Bob");
    });
    expect(mockFetchDisplayName).not.toHaveBeenCalled();
  });

  it("does not call setUsername when fetchDisplayName returns null", async () => {
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });
    mockFetchDisplayName.mockResolvedValue(null);

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockFetchDisplayName).toHaveBeenCalled();
    });
    expect(mockSetUsername).not.toHaveBeenCalled();
  });

  it("swallows errors from fetchDisplayName without crashing or blocking consent flow", async () => {
    mockAuthValue = { userId: "user-1" };
    mockFetchConsentFromProfile.mockResolvedValue({
      privacyAccepted: true,
      analyticsAccepted: true,
    });
    mockFetchDisplayName.mockRejectedValue(new Error("network failure"));

    renderHook(() => useAuthStateListener());

    await waitFor(() => {
      expect(mockAcceptConsent).toHaveBeenCalled();
    });
    expect(mockSetUsername).not.toHaveBeenCalled();
  });

  it("does not call setUsername on SIGNED_OUT", () => {
    renderHook(() => useAuthStateListener());

    capturedAuthCallback!("SIGNED_OUT", null);

    expect(mockSetUsername).not.toHaveBeenCalled();
  });
});

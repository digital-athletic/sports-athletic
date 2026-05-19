/**
 * Unit tests for AuthService
 * Tests requestLoginOtp, requestRegistrationOtp and mapSupabaseError mapping
 */

import {
  deleteAccount,
  fetchConsentFromProfile,
  fetchDisplayName,
  logout,
  requestLoginOtp,
  requestRegistrationOtp,
  saveConsentToProfile,
  saveDisplayName,
} from "./AuthService";

const mockSignInWithOtp = jest.fn();
const mockGetSession = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockFunctionsInvoke = jest.fn();
const mockSignOut = jest.fn();
const mockRpc = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockUpsert = jest.fn();
const mockFrom = jest.fn((_table: string) => ({
  select: mockSelect,
  upsert: mockUpsert,
}));
jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      getUser: () => mockGetUser(),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
    from: (table: string) => mockFrom(table),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const mockClearAuth = jest.fn();
let mockAuthStoreAuth: { userId: string } | null = null;
jest.mock("../store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      clearAuth: mockClearAuth,
      get auth() {
        return mockAuthStoreAuth;
      },
    }),
  },
}));

let mockIsReviewUserId = false;
jest.mock("../config/featureFlags", () => ({
  featureFlags: {
    isReviewUserId: (_userId: string) => mockIsReviewUserId,
  },
}));

describe("requestLoginOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls signInWithOtp with shouldCreateUser: false", async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

    await requestLoginOtp("test@example.com");

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: { shouldCreateUser: false },
    });
  });

  it("throws auth/user-not-found for user_not_found or otp_disabled", async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: { message: "User not found", code: "otp_disabled" },
    });

    await expect(requestLoginOtp("test@example.com")).rejects.toMatchObject({
      code: "auth/user-not-found",
    });
  });

  it("throws auth/too-many-requests for rate limit errors", async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: {
        message: "Rate limit exceeded",
        code: "over_email_send_rate_limit",
      },
    });

    await expect(requestLoginOtp("test@example.com")).rejects.toMatchObject({
      code: "auth/too-many-requests",
    });
  });

  it("throws auth/network-request-failed for network errors", async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: { message: "Network error occurred", code: "" },
    });

    await expect(requestLoginOtp("test@example.com")).rejects.toMatchObject({
      code: "auth/network-request-failed",
    });
  });
});

describe("requestRegistrationOtp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls signInWithOtp with shouldCreateUser: true and user metadata", async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });

    await requestRegistrationOtp("test@example.com", true);

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      options: {
        shouldCreateUser: true,
        data: { anonymisedDataUse: true },
      },
    });
  });

  it("throws auth/email-already-in-use for already registered error", async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: {
        message: "User already been registered",
        code: "email_exists",
      },
    });

    await expect(
      requestRegistrationOtp("test@example.com", false),
    ).rejects.toMatchObject({
      code: "auth/email-already-in-use",
    });
  });

  it("throws auth/invalid-email for invalid email error", async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: {},
      error: { message: "Invalid email", code: "invalid_email" },
    });

    await expect(
      requestRegistrationOtp("not-an-email", false),
    ).rejects.toMatchObject({
      code: "auth/invalid-email",
    });
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStoreAuth = null;
    mockIsReviewUserId = false;
  });

  it("invokes delete-account edge function with session token", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: "test-token", user: { id: "user-1" } },
      },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: { deleted: true },
      error: null,
    });

    await deleteAccount();

    expect(mockFunctionsInvoke).toHaveBeenCalledWith("delete-account", {
      headers: { Authorization: "Bearer test-token" },
    });
  });

  it("throws auth/user-not-found when no session exists", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await expect(deleteAccount()).rejects.toMatchObject({
      code: "auth/user-not-found",
    });

    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
  });

  it("throws when edge function returns an error", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: "test-token", user: { id: "user-1" } },
      },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: { message: "Internal error" },
    });

    await expect(deleteAccount()).rejects.toMatchObject({
      code: "auth/unknown",
    });
  });

  it("does nothing for review user — no server call, no logout", async () => {
    mockAuthStoreAuth = { userId: "review-user" };
    mockIsReviewUserId = true;

    await deleteAccount();

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockFunctionsInvoke).not.toHaveBeenCalled();
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it("throws when edge function response has deleted: false", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { access_token: "test-token", user: { id: "user-1" } },
      },
    });
    mockFunctionsInvoke.mockResolvedValue({
      data: { deleted: false },
      error: null,
    });

    await expect(deleteAccount()).rejects.toMatchObject({
      code: "auth/unknown",
    });
  });
});

describe("saveConsentToProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls save_user_consent RPC with privacy and analytics flags", async () => {
    mockRpc.mockResolvedValue({ error: null });

    await saveConsentToProfile({
      privacyAccepted: true,
      analyticsAccepted: false,
    });

    expect(mockRpc).toHaveBeenCalledWith("save_user_consent", {
      p_privacy_accepted: true,
      p_analytics_accepted: false,
    });
  });

  it("does not accept a userId parameter — user_id is resolved server-side", async () => {
    mockRpc.mockResolvedValue({ error: null });

    // The function signature takes only ConsentFlags, never a userId string.
    await saveConsentToProfile({
      privacyAccepted: true,
      analyticsAccepted: true,
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    const [fnName, params] = mockRpc.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(fnName).toBe("save_user_consent");
    expect(params).not.toHaveProperty("user_id");
    expect(params).not.toHaveProperty("userId");
  });

  it("throws on RPC error", async () => {
    mockRpc.mockResolvedValue({ error: { message: "DB error", code: "" } });

    await expect(
      saveConsentToProfile({
        privacyAccepted: false,
        analyticsAccepted: false,
      }),
    ).rejects.toMatchObject({
      code: "auth/unknown",
    });
  });
});

describe("logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves without throwing when signOut succeeds", async () => {
    mockSignOut.mockResolvedValue({});
    await expect(logout()).resolves.not.toThrow();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("resolves without throwing when signOut throws a network error — caller handles cleanup", async () => {
    mockSignOut.mockRejectedValue(new TypeError("Network request failed"));
    await expect(logout()).resolves.not.toThrow();
    // clearAuth is no longer called here — owned by useLogout's finally block
    expect(mockClearAuth).not.toHaveBeenCalled();
  });
});

describe("fetchConsentFromProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaybeSingle.mockReset();
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert });
  });

  it("returns null when no row exists", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await fetchConsentFromProfile();

    expect(result).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith("user_profiles");
    expect(mockSelect).toHaveBeenCalledWith(
      "consent_privacy_accepted, consent_analytics_accepted",
    );
  });

  it("returns consent flags when row has privacy accepted", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        consent_privacy_accepted: true,
        consent_analytics_accepted: true,
      },
      error: null,
    });

    const result = await fetchConsentFromProfile();

    expect(result).toEqual({ privacyAccepted: true, analyticsAccepted: true });
  });

  it("returns consent flags when row has privacy rejected", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        consent_privacy_accepted: false,
        consent_analytics_accepted: false,
      },
      error: null,
    });

    const result = await fetchConsentFromProfile();

    expect(result).toEqual({
      privacyAccepted: false,
      analyticsAccepted: false,
    });
  });

  it("throws on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "DB error", code: "" },
    });

    await expect(fetchConsentFromProfile()).rejects.toMatchObject({
      code: "auth/unknown",
    });
  });
});

describe("fetchDisplayName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the display_name string from session user_metadata", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { user_metadata: { display_name: "Alice" } } },
      },
    });

    const result = await fetchDisplayName();

    expect(result).toBe("Alice");
  });

  it("returns null when display_name is absent from user_metadata", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { user_metadata: {} } } },
    });

    const result = await fetchDisplayName();

    expect(result).toBeNull();
  });

  it("returns null when there is no active session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const result = await fetchDisplayName();

    expect(result).toBeNull();
  });
});

describe("saveDisplayName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    }));
  });

  it("calls updateUser with the correct display_name payload", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });

    await saveDisplayName("Alice");

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { display_name: "Alice" },
    });
  });

  it("skips both writes when display name is empty string", async () => {
    await saveDisplayName("");

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("skips both writes when display name is whitespace only", async () => {
    await saveDisplayName("   ");

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("skips both writes when display name exceeds 64 characters", async () => {
    await saveDisplayName("a".repeat(65));

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("throws a mapped error when updateUser returns an error", async () => {
    mockUpdateUser.mockResolvedValue({
      data: {},
      error: { message: "Update failed", code: "" },
    });

    await expect(saveDisplayName("Alice")).rejects.toMatchObject({
      code: expect.any(String),
    });
  });

  it("upserts display name into team_member_details after updateUser succeeds", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });

    await saveDisplayName("Alice");

    expect(mockFrom).toHaveBeenCalledWith("team_member_details");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-123", display_name: "Alice" }),
      { onConflict: "user_id" },
    );
  });

  it("throws a mapped error when team_member_details upsert fails", async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: { message: "DB error", code: "" } });

    await expect(saveDisplayName("Alice")).rejects.toMatchObject({
      code: expect.any(String),
    });
  });

  it("does not upsert to team_member_details when updateUser fails", async () => {
    mockUpdateUser.mockResolvedValue({
      data: {},
      error: { message: "Auth error", code: "" },
    });

    await expect(saveDisplayName("Alice")).rejects.toBeDefined();

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

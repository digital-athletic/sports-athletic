/**
 * Unit tests for AuthService
 * Tests requestLoginOtp, requestRegistrationOtp and mapSupabaseError mapping
 */

/* eslint-disable import/first */
const mockSignInWithOtp = jest.fn();
const mockGetSession = jest.fn();
const mockFunctionsInvoke = jest.fn();
jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: unknown[]) => mockSignInWithOtp(...args),
      getSession: () => mockGetSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  },
}));

import {
  deleteAccount,
  requestLoginOtp,
  requestRegistrationOtp,
} from "./AuthService";

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

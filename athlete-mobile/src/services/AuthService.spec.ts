/**
 * Unit tests for AuthService
 * Tests registerWithEmail return value and mapSupabaseError mapping
 */

/* eslint-disable import/first */
// Mock supabaseClient before importing AuthService
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) =>
        mockSignInWithPassword(...args),
    },
  },
}));

import { registerWithEmail, signInWithEmail } from "./AuthService";

describe("registerWithEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns requiresEmailConfirmation: false when session is present", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        session: { access_token: "token-123" },
        user: { id: "user-123" },
      },
      error: null,
    });

    const result = await registerWithEmail(
      "test@example.com",
      "password123",
      false,
    );

    expect(result).toEqual({ requiresEmailConfirmation: false });
  });

  it("returns requiresEmailConfirmation: true when session is null", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: { id: "user-123" } },
      error: null,
    });

    const result = await registerWithEmail(
      "test@example.com",
      "password123",
      true,
    );

    expect(result).toEqual({ requiresEmailConfirmation: true });
  });

  it("passes email and password to supabase signUp", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: { id: "user-123" } },
      error: null,
    });

    await registerWithEmail("test@example.com", "password123", false);

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("throws auth/email-already-in-use for already registered error", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "User already been registered",
        code: "email_exists",
      },
    });

    await expect(
      registerWithEmail("test@example.com", "password123", false),
    ).rejects.toMatchObject({
      code: "auth/email-already-in-use",
    });
  });

  it("throws auth/weak-password for weak password error", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Password should be at least 6 characters",
        code: "",
      },
    });

    await expect(
      registerWithEmail("test@example.com", "123", false),
    ).rejects.toMatchObject({
      code: "auth/weak-password",
    });
  });

  it("throws auth/invalid-email for invalid email error", async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Invalid email",
        code: "invalid_email",
      },
    });

    await expect(
      registerWithEmail("not-an-email", "password123", false),
    ).rejects.toMatchObject({
      code: "auth/invalid-email",
    });
  });
});

describe("mapSupabaseError - email not confirmed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws auth/email-not-confirmed for email_not_confirmed code", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Email not confirmed",
        code: "email_not_confirmed",
      },
    });

    await expect(
      signInWithEmail("test@example.com", "password123"),
    ).rejects.toMatchObject({
      code: "auth/email-not-confirmed",
    });
  });

  it("throws auth/email-not-confirmed when message includes 'email not confirmed'", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Email not confirmed yet",
        code: "",
      },
    });

    await expect(
      signInWithEmail("test@example.com", "password123"),
    ).rejects.toMatchObject({
      code: "auth/email-not-confirmed",
    });
  });

  it("throws auth/wrong-password for invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Invalid login credentials",
        code: "invalid_credentials",
      },
    });

    await expect(
      signInWithEmail("test@example.com", "wrongpassword"),
    ).rejects.toMatchObject({
      code: "auth/wrong-password",
    });
  });

  it("throws auth/network-request-failed for network errors", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Network error occurred",
        code: "",
      },
    });

    await expect(
      signInWithEmail("test@example.com", "password123"),
    ).rejects.toMatchObject({
      code: "auth/network-request-failed",
    });
  });
});

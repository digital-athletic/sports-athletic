import { supabase } from "./supabaseClient";

/**
 * Authentication Service
 *
 * Handles user authentication operations using Supabase Auth.
 * Uses passwordless OTP flow: send code via email, verify to create session.
 */

/**
 * Maps Supabase auth errors to app-compatible error codes
 */
const mapSupabaseError = (error: {
  message?: string;
  code?: string;
}): Error => {
  const authError: Error & { code?: string } = new Error(
    error.message || "Authentication error",
  );

  const message = error.message?.toLowerCase() || "";
  const code = error.code?.toLowerCase() || "";

  if (
    message.includes("user not found") ||
    code.includes("user_not_found") ||
    code.includes("otp_disabled")
  ) {
    authError.code = "auth/user-not-found";
  } else if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    code.includes("email_exists")
  ) {
    authError.code = "auth/email-already-in-use";
  } else if (
    message.includes("invalid email") ||
    code.includes("invalid_email")
  ) {
    authError.code = "auth/invalid-email";
  } else if (
    message.includes("email not confirmed") ||
    code.includes("email_not_confirmed")
  ) {
    authError.code = "auth/email-not-confirmed";
  } else if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    code.includes("over_request_rate_limit") ||
    code.includes("over_email_send_rate_limit")
  ) {
    authError.code = "auth/too-many-requests";
  } else if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    authError.code = "auth/network-request-failed";
  } else {
    authError.code = "auth/unknown";
  }

  return authError;
};

/**
 * Request a login OTP code for an existing user
 */
export const requestLoginOtp = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    throw mapSupabaseError(error);
  }
};

/**
 * Request a registration OTP code, creating the user if needed
 */
export const requestRegistrationOtp = async (
  email: string,
  anonymisedDataUse: boolean,
): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { anonymisedDataUse },
    },
  });

  if (error) {
    throw mapSupabaseError(error);
  }
};

/**
 * Sign out the current user
 */
export const logout = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapSupabaseError(error);
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<{
  userId: string;
  token: string;
} | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return {
    userId: session.user.id,
    token: session.access_token,
  };
};

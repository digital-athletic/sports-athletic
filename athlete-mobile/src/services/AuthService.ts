import type { AuthType } from "../store/authStore";
import { supabase } from "./supabaseClient";

/**
 * Authentication Service
 *
 * Handles user authentication operations using Supabase Auth.
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
    message.includes("invalid login credentials") ||
    code.includes("invalid_credentials")
  ) {
    authError.code = "auth/wrong-password";
  } else if (
    message.includes("user not found") ||
    code.includes("user_not_found")
  ) {
    authError.code = "auth/user-not-found";
  } else if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    code.includes("email_exists")
  ) {
    authError.code = "auth/email-already-in-use";
  } else if (
    message.includes("password") &&
    (message.includes("weak") ||
      message.includes("short") ||
      message.includes("at least"))
  ) {
    authError.code = "auth/weak-password";
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
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<AuthType> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  if (!data.user || !data.session) {
    const authError: Error & { code?: string } = new Error(
      "Authentication failed",
    );
    authError.code = "auth/unknown";
    throw authError;
  }

  return {
    userId: data.user.id,
    token: data.session.access_token,
  };
};

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  _anonymisedDataUse: boolean,
): Promise<{ requiresEmailConfirmation: boolean }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw mapSupabaseError(error);
  }

  return { requiresEmailConfirmation: !data.session };
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

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
export const getCurrentUser = async (): Promise<AuthType | null> => {
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

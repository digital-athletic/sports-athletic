import { supabase } from "./supabaseClient";
import { useAuthStore } from "../store/authStore";
import { featureFlags } from "../config/featureFlags";

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
 * Delete the current user's account via the delete-account edge function.
 * All user data is cascade-deleted on the database level.
 */
export const deleteAccount = async (): Promise<void> => {
  const auth = useAuthStore.getState().auth;
  if (auth && featureFlags.isReviewUserId(auth.userId)) {
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw mapSupabaseError({
      message: "User not found",
      code: "user_not_found",
    });
  }

  const { data, error: invokeError } = await supabase.functions.invoke(
    "delete-account",
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (invokeError) {
    throw mapSupabaseError(invokeError);
  }

  if (!data?.deleted) {
    throw mapSupabaseError({ message: "Failed to delete account" });
  }
};

/**
 * Sign out the current user. Clears local auth even if signOut throws.
 */
export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch {
    // Network error during sign out — proceed with local cleanup
  }
  // Always clear local auth regardless of signOut result
  useAuthStore.getState().clearAuth();
};

type ConsentFlags = {
  privacyAccepted: boolean;
  analytics: boolean;
};

export type ConsentRecord = {
  privacyAccepted: boolean;
  analyticsAccepted: boolean;
};

/**
 * Fetch consent record from user_profiles. Returns null when no row exists.
 */
export const fetchConsentFromProfile = async (
  userId: string,
): Promise<ConsentRecord | null> => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("consent_privacy_accepted, consent_analytics_accepted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error);
  }

  if (!data) return null;

  return {
    privacyAccepted: data.consent_privacy_accepted === true,
    analyticsAccepted: data.consent_analytics_accepted === true,
  };
};

/**
 * Upsert all three consent flags to user_profiles
 */
export const saveConsentToProfile = async (
  userId: string,
  consent: ConsentFlags,
): Promise<void> => {
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: userId,
    consent_privacy_accepted: consent.privacyAccepted,
    consent_analytics_accepted: consent.analytics,
    consent_updated_at: new Date().toISOString(),
  });

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

import { useState, useEffect, useCallback } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

type OtpErrorCode = "tooManyRequests" | "unknown";

interface UseAuthReturn extends AuthState {
  requestOtp: (email: string) => Promise<{ error: OtpErrorCode | null }>;
  verifyOtp: (
    email: string,
    token: string,
  ) => Promise<{ error: "invalidOtp" | null }>;
  signOut: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const requestOtp = useCallback(
    async (email: string): Promise<{ error: OtpErrorCode | null }> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (!error) return { error: null };

      const message = error.message?.toLowerCase() ?? "";
      const code = error.code?.toLowerCase() ?? "";

      if (
        message.includes("user not found") ||
        code.includes("user_not_found") ||
        code.includes("otp_disabled")
      ) {
        return { error: null };
      }
      if (
        message.includes("rate limit") ||
        message.includes("too many requests") ||
        code.includes("over_request_rate_limit") ||
        code.includes("over_email_send_rate_limit")
      ) {
        return { error: "tooManyRequests" };
      }
      return { error: "unknown" };
    },
    [],
  );

  const verifyOtp = useCallback(
    async (
      email: string,
      token: string,
    ): Promise<{ error: "invalidOtp" | null }> => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      return { error: error ? "invalidOtp" : null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    ...state,
    requestOtp,
    verifyOtp,
    signOut,
  };
};

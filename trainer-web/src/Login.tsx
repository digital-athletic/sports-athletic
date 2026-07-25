import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AuthPageLayout } from "./components/AuthPageLayout";
import { LoginForm } from "./components/LoginForm";
import { useAuth } from "./hooks/useAuth";
import { type LoginStep } from "./types/auth";

const RESEND_COOLDOWN_SECONDS = 60;

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/teams", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: otpError } = await requestOtp(email);
    setLoading(false);

    if (otpError === "tooManyRequests") {
      setError(t("login.tooManyRequests"));
    } else if (otpError) {
      setError(t("login.unknownError"));
    } else {
      setStep("otp");
      startCooldown();
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await verifyOtp(email, otp);
    setLoading(false);

    if (verifyError) {
      setError(t("login.invalidOtp"));
      setOtp("");
    } else {
      navigate("/teams");
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const { error: otpError } = await requestOtp(email);
    if (otpError === "tooManyRequests") {
      setError(t("login.tooManyRequests"));
    } else if (otpError) {
      setError(t("login.unknownError"));
    } else {
      startCooldown();
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError(null);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = null;
    setResendCooldown(0);
  };

  return (
    <AuthPageLayout>
      <LoginForm
        step={step}
        email={email}
        otp={otp}
        error={error}
        loading={loading || authLoading}
        resendCooldown={resendCooldown}
        onEmailChange={setEmail}
        onOtpChange={setOtp}
        onEmailSubmit={handleEmailSubmit}
        onOtpSubmit={handleOtpSubmit}
        onResend={handleResend}
        onBackToEmail={handleBackToEmail}
      />
    </AuthPageLayout>
  );
};

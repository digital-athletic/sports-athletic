import { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { type LoginStep } from "../types/auth";
import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";
import { FormInput } from "./FormInput";

interface LoginFormProps {
  step: LoginStep;
  email: string;
  otp: string;
  error: string | null;
  loading: boolean;
  resendCooldown: number;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onEmailSubmit: (e: FormEvent) => void;
  onOtpSubmit: (e: FormEvent) => void;
  onResend: () => void;
  onBackToEmail: () => void;
}

export function LoginForm({
  step,
  email,
  otp,
  error,
  loading,
  resendCooldown,
  onEmailChange,
  onOtpChange,
  onEmailSubmit,
  onOtpSubmit,
  onResend,
  onBackToEmail,
}: LoginFormProps) {
  const { t } = useTranslation();

  if (step === "otp") {
    return (
      <form onSubmit={onOtpSubmit} className="flex flex-col gap-4">
        <div className="mb-2 flex items-center">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="px-4 text-base font-medium text-gray-800">
            {t("login.verifyTitle")}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <p className="text-center text-sm text-gray-600">
          {t("login.otpSentMessage")}{" "}
          <span className="font-medium text-gray-900">{email}</span>
        </p>

        {error && <ErrorMessage message={error} />}

        <FormInput
          data-testid="login-otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/[^0-9]/g, ""))}
          required
          placeholder="_ _ _ _ _ _"
          className="text-center text-2xl tracking-widest"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
        />

        <Button
          data-testid="login-verify"
          type="submit"
          disabled={loading || otp.length !== 6}
          isLoading={loading}
          loadingText={t("common.loading")}
          className="w-full py-3.5 text-base"
        >
          {t("login.verifyCode")}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onResend}
          disabled={resendCooldown > 0}
          className="w-full py-3.5 text-base"
        >
          {resendCooldown > 0
            ? `${t("login.resendCode")} (${resendCooldown}s)`
            : t("login.resendCode")}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBackToEmail}
            className="cursor-pointer text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            {t("login.backToEmail")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onEmailSubmit} className="flex flex-col gap-4">
      <div className="mb-2 flex items-center">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="px-4 text-base font-medium text-gray-800">
          {t("login.title")}
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {error && <ErrorMessage message={error} />}

      <FormInput
        data-testid="login-email"
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        placeholder={t("login.email")}
      />

      <Button
        data-testid="login-send-code"
        type="submit"
        disabled={loading}
        isLoading={loading}
        loadingText={t("common.loading")}
        className="w-full py-3.5 text-base"
      >
        {t("login.sendCode")}
      </Button>

      <div className="mt-2 text-center">
        <span className="text-sm text-gray-500">
          {t("login.registerViaApp")}
        </span>
      </div>
    </form>
  );
}

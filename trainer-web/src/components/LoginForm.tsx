import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { ErrorMessage } from "./ErrorMessage";
import { FormInput } from "./FormInput";

type AuthMode = "login" | "signup";

interface LoginFormProps {
  mode: AuthMode;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function LoginForm({
  mode,
  email,
  password,
  confirmPassword,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: LoginFormProps) {
  const { t } = useTranslation();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="mb-2 flex items-center">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="px-4 text-base font-medium text-gray-800">
          {mode === "login" ? t("login.title") : t("login.signupTitle")}
        </span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {error && <ErrorMessage message={error} />}

      <FormInput
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        placeholder={t("login.email")}
      />

      <FormInput
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        required
        placeholder={t("login.password")}
      />

      {mode === "signup" && (
        <FormInput
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          required
          placeholder={t("login.confirmPassword")}
        />
      )}

      {mode === "signup" && (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 accent-red-600"
          />
          <span>
            {t("login.privacyConsentPrefix")}{" "}
            <a
              href="https://www.ingemarpohl-ug.de/startseite/datenschutzerkl%C3%A4rung"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              {t("login.privacyConsentLink")}
            </a>
            {t("login.privacyConsentSuffix") && (
              <> {t("login.privacyConsentSuffix")}</>
            )}
          </span>
        </label>
      )}

      <Button
        type="submit"
        disabled={loading || (mode === "signup" && !privacyAccepted)}
        isLoading={loading}
        loadingText={t("common.loading")}
        className="w-full py-3.5 text-base"
      >
        {mode === "login" ? t("login.submit") : t("login.signupSubmit")}
      </Button>

      {mode === "login" && (
        <div className="text-center">
          <span className="cursor-pointer text-sm text-gray-500 transition-colors hover:text-gray-800">
            {t("login.resetPassword")}
          </span>
        </div>
      )}

      <div className="mt-2 text-center">
        <span className="text-sm text-gray-500">
          {t("login.registerViaApp")}
        </span>
      </div>
    </form>
  );
}

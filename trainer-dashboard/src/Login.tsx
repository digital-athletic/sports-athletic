import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AuthPageLayout } from "./components/AuthPageLayout";
import { LoginForm } from "./components/LoginForm";
import { SignupSuccessMessage } from "./components/SignupSuccessMessage";
import { useAuth } from "./hooks/useAuth";

type AuthMode = "login" | "signup";

export const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/teams", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError(t("login.passwordMismatch"));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(t("login.passwordTooShort"));
        setLoading(false);
        return;
      }

      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSignupSuccess(true);
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(t("login.invalidCredentials"));
      } else {
        navigate("/teams");
      }
    }

    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError(null);
    setSignupSuccess(false);
    setConfirmPassword("");
  };

  const handleBackToLogin = () => {
    setMode("login");
    setSignupSuccess(false);
  };

  if (signupSuccess) {
    return <SignupSuccessMessage onBackToLogin={handleBackToLogin} />;
  }

  return (
    <AuthPageLayout>
      <LoginForm
        mode={mode}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        error={error}
        loading={loading || authLoading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleSubmit}
        onSwitchMode={switchMode}
      />
    </AuthPageLayout>
  );
};

import { useTranslation } from "react-i18next";
import { AuthPageLayout } from "./AuthPageLayout";
import { Button } from "./Button";

interface SignupSuccessMessageProps {
  onBackToLogin: () => void;
}

export function SignupSuccessMessage({
  onBackToLogin,
}: SignupSuccessMessageProps) {
  const { t } = useTranslation();

  return (
    <AuthPageLayout>
      <div className="text-center">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          {t("login.signupSuccessTitle")}
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          {t("login.signupSuccessMessage")}
        </p>
        <Button onClick={onBackToLogin} className="w-full py-3.5 text-base">
          {t("login.backToLogin")}
        </Button>
      </div>
    </AuthPageLayout>
  );
}

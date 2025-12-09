import { useTranslation } from "react-i18next";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text, className = "" }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  return (
    <div className={`text-center text-gray-500 ${className}`}>
      {text || t("common.loading")}
    </div>
  );
}

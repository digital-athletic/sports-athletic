import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import logo from "../assets/SA_dark.png";
import { LegalFooter } from "./LegalFooter";

interface AuthPageLayoutProps {
  children: ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-8">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-10 shadow-lg">
        <div className="mb-8 flex justify-center">
          <img
            src={logo}
            className="h-[120px] w-[120px] object-contain"
            alt={t("common.logoAlt")}
          />
        </div>
        {children}
      </div>
      <LegalFooter />
    </div>
  );
}

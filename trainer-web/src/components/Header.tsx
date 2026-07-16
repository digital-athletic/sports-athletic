import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import appIcon from "@logos/app-icon/app-icon.png";
import { useAuth } from "../hooks/useAuth";

export const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 lg:max-w-5xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/teams")}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <img
              src={appIcon}
              className="h-10 w-10"
              alt={t("common.logoAlt")}
            />
            <span className="text-xl font-semibold text-gray-900">
              {t("common.brandName")}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("common.logout")}
          </button>
        </div>
      </div>
    </header>
  );
};

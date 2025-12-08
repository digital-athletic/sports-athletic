import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import appIcon from "./assets/app-icon.png";

export const TeamSelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelectTeam = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 lg:max-w-5xl">
          <div className="flex items-center gap-3">
            <img
              src={appIcon}
              className="h-10 w-10"
              alt={t("common.logoAlt")}
            />
            <span className="text-xl font-semibold text-gray-900">
              {t("common.brandName")}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 lg:max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          {t("teamSelection.title")}
        </h1>
        <p className="mb-8 text-gray-600">{t("teamSelection.description")}</p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={handleSelectTeam}
            className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-red-500 hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              FC Musterstadt U19
            </h2>
            <p className="text-sm text-gray-500">
              {t("teamSelection.players", { count: 12 })}
            </p>
          </button>
        </div>
      </main>
    </div>
  );
};

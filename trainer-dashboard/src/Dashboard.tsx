import { useState } from "react";
import { useTranslation } from "react-i18next";
import appIcon from "./assets/app-icon.png";

export const Dashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("team");

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
            <h1 className="ml-auto text-2xl font-semibold text-gray-900">
              {t("dashboard.title")}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 lg:max-w-5xl">
        <div className="flex gap-6">
          <div className="flex-1 overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-6 py-3 text-sm transition-all ${
                  activeTab === "team"
                    ? "border-b-2 border-red-600 font-medium text-red-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("team")}
              >
                {t("dashboard.tabs.team")}
              </button>
              <button
                className={`px-6 py-3 text-sm transition-all ${
                  activeTab === "evaluations"
                    ? "border-b-2 border-red-600 font-medium text-red-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("evaluations")}
              >
                {t("dashboard.tabs.evaluations")}
              </button>
              <button
                className={`px-6 py-3 text-sm transition-all ${
                  activeTab === "settings"
                    ? "border-b-2 border-red-600 font-medium text-red-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                {t("dashboard.tabs.settings")}
              </button>
            </div>

            <div className="p-6">
              {activeTab === "team" && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      {t("dashboard.players.title")}
                    </span>
                    <button className="rounded bg-green-500 px-6 py-2.5 text-sm text-white transition-colors hover:bg-green-600">
                      {t("dashboard.players.addPlayer")}
                    </button>
                  </div>

                  <div className="flex min-h-[300px] items-center justify-center rounded border border-gray-200 bg-gray-50">
                    <span className="text-sm text-gray-400">
                      {t("dashboard.players.noRows")}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
                    <span>
                      {t("dashboard.players.showingResults", { count: 0 })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="rounded border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50">
                        &lt;
                      </button>
                      <span>
                        {t("dashboard.players.ofPages", { count: 1 })}
                      </span>
                      <button className="rounded border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50">
                        &gt;
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
                        title="Download"
                      >
                        &#8595;
                      </button>
                      <button
                        className="rounded border border-gray-300 px-2.5 py-1.5 hover:bg-gray-50"
                        title="Refresh"
                      >
                        &#8635;
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "evaluations" && (
                <div className="text-sm text-gray-400">
                  {t("dashboard.tabs.evaluations")} content
                </div>
              )}

              {activeTab === "settings" && (
                <div className="text-sm text-gray-400">
                  {t("dashboard.tabs.settings")} content
                </div>
              )}
            </div>
          </div>

          <div className="flex w-80 flex-col gap-6">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {t("dashboard.info.title")}
                </span>
                <span className="text-xs text-gray-500">
                  {t("dashboard.info.availableCodes")}
                </span>
              </div>
              <div className="mb-3 min-h-[80px] rounded border border-gray-200 bg-gray-50"></div>
              <button
                className="w-full cursor-not-allowed rounded border border-gray-300 bg-gray-100 py-2.5 text-sm text-gray-400"
                disabled
              >
                {t("dashboard.players.removePlayer")}
              </button>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {t("dashboard.subscription.title")}
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                {t("dashboard.subscription.noSubscription")}
              </p>
              <button className="w-full rounded border border-gray-300 bg-white py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                {t("dashboard.subscription.activate")}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

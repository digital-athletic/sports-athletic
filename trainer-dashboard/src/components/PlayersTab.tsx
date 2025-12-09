import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export function PlayersTab() {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-medium text-gray-700">
          {t("dashboard.players.title")}
        </span>
        <Button className="bg-green-500 px-6 py-2.5 hover:bg-green-600">
          {t("dashboard.players.addPlayer")}
        </Button>
      </div>

      <div className="flex min-h-[300px] items-center justify-center rounded border border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-400">
          {t("dashboard.players.noRows")}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
        <span>{t("dashboard.players.showingResults", { count: 0 })}</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="px-2.5 py-1.5">
            &lt;
          </Button>
          <span>{t("dashboard.players.ofPages", { count: 1 })}</span>
          <Button variant="secondary" className="px-2.5 py-1.5">
            &gt;
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-2.5 py-1.5"
            title="Download"
          >
            &#8595;
          </Button>
          <Button variant="secondary" className="px-2.5 py-1.5" title="Refresh">
            &#8635;
          </Button>
        </div>
      </div>
    </>
  );
}

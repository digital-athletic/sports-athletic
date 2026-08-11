import { useTranslation } from "react-i18next";
import { PageLayout } from "./components/PageLayout";
import NOTICES from "./thirdPartyNotices.json";

export function ThirdPartyNotices() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {t("thirdPartyNotices.title")}
      </h1>
      <p className="mb-8 text-gray-600">{t("thirdPartyNotices.description")}</p>

      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {NOTICES.map((dep) => (
          <li key={`${dep.name}@${dep.version}`} className="px-4 py-3">
            <p className="font-medium text-gray-900">{dep.name}</p>
            <p className="text-sm text-gray-500">
              {dep.version} · {dep.license}
            </p>
          </li>
        ))}
      </ul>
    </PageLayout>
  );
}

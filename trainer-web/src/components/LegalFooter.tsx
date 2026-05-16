import { useTranslation } from "react-i18next";

export function LegalFooter() {
  const { t } = useTranslation();

  return (
    <footer className="py-4 text-center text-xs text-gray-400">
      <a
        href="https://www.ingemarpohl-ug.de/startseite/impressum"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-600 hover:underline"
      >
        {t("footer.imprint")}
      </a>
      <span className="mx-2">·</span>
      <a
        href="https://www.ingemarpohl-ug.de/startseite/datenschutz-app"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-600 hover:underline"
      >
        {t("footer.privacyPolicy")}
      </a>
    </footer>
  );
}

import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const LINK_CLASS = "hover:text-gray-800 hover:underline";

export function LegalFooter() {
  const { t } = useTranslation();

  const externalLinks = [
    {
      href: "https://www.ingemarpohl-ug.de/startseite/impressum",
      label: t("footer.imprint"),
    },
    {
      href: "https://www.ingemarpohl-ug.de/startseite/datenschutz-app",
      label: t("footer.privacyPolicy"),
    },
    {
      href: import.meta.env.VITE_LINK_A11Y_STATEMENT,
      label: t("footer.accessibilityStatement"),
    },
    {
      href: import.meta.env.VITE_LINK_A11Y_FEEDBACK,
      label: t("footer.accessibilityFeedback"),
    },
  ].filter((link) => Boolean(link.href));

  return (
    <footer className="py-4 text-center text-xs text-gray-600">
      {externalLinks.map((link) => (
        <Fragment key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            {link.label}
          </a>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
        </Fragment>
      ))}
      <Link to="/third-party-notices" className={LINK_CLASS}>
        {t("footer.thirdPartyNotices")}
      </Link>
    </footer>
  );
}

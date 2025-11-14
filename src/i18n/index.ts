import * as i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LANGUAGE_CODE,
  deviceLanguageDetector,
} from "./deviceLanguageDetector";

import deTranslations from "./locales/de.json";
import enTranslations from "./locales/en.json";

const resources = {
  de: {
    translations: deTranslations,
  },
  en: {
    translations: enTranslations,
  },
};

// Initialize i18next
i18n
  .use(deviceLanguageDetector) // Use custom language detector
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    fallbackLng: DEFAULT_LANGUAGE_CODE, // Default language
    // Uncomment to enable debug mode in development
    // debug: __DEV__,
    resources,
    ns: ["translations"], // List of namespaces
    defaultNS: "translations", // Default namespace
  });

export default i18n;

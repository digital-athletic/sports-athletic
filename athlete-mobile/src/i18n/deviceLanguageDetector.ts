import { getLocales } from "expo-localization";
import { LanguageDetectorModule } from "i18next";

/**
 * Default language if device locale cannot be detected
 */
export const DEFAULT_LANGUAGE_CODE = "en";

/**
 * Custom language detector plugin for i18next that uses Expo Localization to detect the device's language settings
 *
 * For more information, refer to the i18next documentation:
 * @link https://www.i18next.com/misc/creating-own-plugins#languagedetector
 */
export const deviceLanguageDetector: LanguageDetectorModule = {
  type: "languageDetector",
  detect: () => {
    const [deviceLocale] = getLocales(); // Get language code (e.g., "en" from "en-US")

    return deviceLocale?.languageCode || DEFAULT_LANGUAGE_CODE;
  },
};

import { useTranslation } from "react-i18next";
import enTranslations from "@/i18n/locales/en.json";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { formatRangeNumber } from "./referenceRange";

type TranslatedTestCode = keyof typeof enTranslations.performanceTests.tests;

function isTranslatedTestCode(code: string): code is TranslatedTestCode {
  return Object.hasOwn(enTranslations.performanceTests.tests, code);
}

/** The translated test name, or the code for a test without a translation. */
export function useTestName(code: string): string {
  const { t } = useTranslation();

  return isTranslatedTestCode(code)
    ? t(`performanceTests.tests.${code}`)
    : code;
}

/** The reference line of a test, e.g. "Reference 9.87 to 6.54 s", or the no reference text. */
export function useReferenceLine(
  test: SportTest,
  range: SportTestReferenceValue | null,
): string {
  const { t, i18n } = useTranslation();

  if (range === null) return t("more.performanceTests.noReference");

  return t("more.performanceTests.reference", {
    start: formatRangeNumber(range.rangeStart, i18n.language),
    end: formatRangeNumber(range.rangeEnd, i18n.language),
    unit: test.unit,
  });
}

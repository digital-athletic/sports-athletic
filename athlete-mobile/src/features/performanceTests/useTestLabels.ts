import { useTranslation } from "react-i18next";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { formatRangeNumber } from "./referenceRange";
import { resolveTestName, resolveTestUnit } from "./testTranslations";

/** The test name in the athlete's language, the English name, or the code. */
export function useTestName(test: SportTest): string {
  const { i18n } = useTranslation();

  return resolveTestName(test, i18n.language);
}

/** The test unit in the athlete's language, or the stored unit. */
export function useTestUnit(test: SportTest): string {
  const { i18n } = useTranslation();

  return resolveTestUnit(test, i18n.language);
}

/** The reference line of a test, e.g. "Reference 9.87 to 6.54 s", or the no reference text. */
export function useReferenceLine(
  test: SportTest,
  range: SportTestReferenceValue | null,
): string {
  const { t, i18n } = useTranslation();
  const unit = useTestUnit(test);

  if (range === null) return t("more.performanceTests.noReference");

  return t("more.performanceTests.reference", {
    start: formatRangeNumber(range.rangeStart, i18n.language),
    end: formatRangeNumber(range.rangeEnd, i18n.language),
    unit,
  });
}

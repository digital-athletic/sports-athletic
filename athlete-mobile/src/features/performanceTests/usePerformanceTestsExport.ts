import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Alert } from "@/common/Alert";
import { useCsvShare } from "@/hooks/useCsvShare";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { buildCsv } from "@/utils/csv";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import {
  buildPerformanceTestsFileName,
  toPerformanceTestRows,
} from "./performanceTestsCsv";

const HEADER_KEYS = ["date", "sport", "test", "value", "unit"] as const;

type ExportSource = {
  values: PerformanceTestValue[];
  tests: SportTest[];
  language: string;
  t: TFunction;
};

const buildPerformanceTestsCsv = ({
  values,
  tests,
  language,
  t,
}: ExportSource): string =>
  buildCsv(
    HEADER_KEYS.map((key) => t(`more.performanceTests.export.headers.${key}`)),
    toPerformanceTestRows({
      values,
      tests,
      language,
      sportLabel: (sport) => t(`sports.${sport}`, { defaultValue: sport }),
    }),
  );

/**
 * Exports every recorded performance test result of every sport as CSV, with test names and units from `tests`.
 * Without a recorded result, an alert replaces the empty file.
 */
export function usePerformanceTestsExport(tests: SportTest[]): {
  exportCsv: () => Promise<void>;
  isExporting: boolean;
} {
  const { t, i18n } = useTranslation();
  const values = usePerformanceTestValuesStore((state) => state.values);
  const { share, isSharing } = useCsvShare();

  const exportCsv = async () => {
    if (values.length === 0) {
      Alert.alert(t("more.performanceTests.export.noResults"));
      return;
    }

    await share(
      buildPerformanceTestsFileName(new Date()),
      buildPerformanceTestsCsv({ values, tests, language: i18n.language, t }),
    );
  };

  return { exportCsv, isExporting: isSharing };
}

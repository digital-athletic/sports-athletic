import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { CsvExportButton } from "@/common/CsvExportButton";
import { Box } from "@/theme/Box";
import { type SportTest } from "./models/SportTest";
import { usePerformanceTestsExport } from "./usePerformanceTestsExport";

/** Header button that downloads every recorded performance test result as CSV. */
export const PerformanceTestsExportButton: FC<{ tests: SportTest[] }> = ({
  tests,
}) => {
  const { t } = useTranslation();
  const { exportCsv, isExporting } = usePerformanceTestsExport(tests);

  // The navigation header puts the right item at the screen edge.
  return (
    <Box paddingRight="m">
      <CsvExportButton
        onPress={exportCsv}
        disabled={isExporting}
        accessibilityLabel={t("more.performanceTests.export.label")}
        testID="performance-tests-export-button"
      />
    </Box>
  );
};

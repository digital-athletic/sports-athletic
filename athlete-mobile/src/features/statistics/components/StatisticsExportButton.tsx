import { CsvExportButton } from "@/common/CsvExportButton";
import { useStatisticsExport } from "@/features/statistics/hooks/useStatisticsExport";
import type { ExportKind } from "@/features/statistics/models/statisticsCsv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface StatisticsExportButtonProps {
  kind: ExportKind;
  scale: ScaleType;
}

/** Header button that downloads the active sub tab and range as CSV. */
export const StatisticsExportButton: FC<StatisticsExportButtonProps> = ({
  kind,
  scale,
}) => {
  const { t } = useTranslation();
  const { canExport, exportCsv } = useStatisticsExport({ kind, scale });

  return (
    <CsvExportButton
      onPress={exportCsv}
      disabled={!canExport}
      accessibilityLabel={t("statistics.export.label")}
      testID="statistics-export-button"
    />
  );
};

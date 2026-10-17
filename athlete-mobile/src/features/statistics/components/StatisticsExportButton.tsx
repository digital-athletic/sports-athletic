import { Ionicon } from "@/common/Ionicon";
import { useStatisticsExport } from "@/features/statistics/hooks/useStatisticsExport";
import type { ExportKind } from "@/features/statistics/models/statisticsCsv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
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
  const { colors } = useTheme();
  const { canExport, exportCsv } = useStatisticsExport({ kind, scale });
  const color = canExport ? "primary" : "lightGrey3";

  return (
    <TouchableBox
      onPress={exportCsv}
      disabled={!canExport}
      accessibilityRole="button"
      accessibilityLabel={t("statistics.export.label")}
      accessibilityState={{ disabled: !canExport }}
      testID="statistics-export-button"
      flexDirection="row"
      alignItems="center"
      paddingVertical="xs"
    >
      <Ionicon name="download-outline" size={18} color={colors[color]} />
      <Text variant="small" color={color} marginLeft="xs">
        {t("statistics.export.button")}
      </Text>
    </TouchableBox>
  );
};

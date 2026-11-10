import { StatisticsExportButton } from "@/features/statistics/components/StatisticsExportButton";
import type { ExportKind } from "@/features/statistics/models/statisticsCsv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { ChoiceChips } from "@/form/ChoiceChips";
import { SegmentedControl } from "@/form/SegmentedControl";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

const SCALES: ScaleType[] = ["week", "month", "year", "total"];

interface StatisticsHeaderProps {
  kind: ExportKind;
  onKindChange: (kind: ExportKind) => void;
  scale: ScaleType;
  setScale: (scale: ScaleType) => void;
}

const isScale = (value: string): value is ScaleType =>
  SCALES.some((scale) => scale === value);

/** Headline, toggle between training and power test, range chips and CSV export. */
export const StatisticsHeader: FC<StatisticsHeaderProps> = ({
  kind,
  onKindChange,
  scale,
  setScale,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      paddingHorizontal="m"
      paddingTop="l"
      paddingBottom="s"
      gap="m"
      testID="statistics-header"
    >
      <Text variant="display" accessibilityRole="header">
        {t("statistics.screenTitle")}
      </Text>
      <SegmentedControl<ExportKind>
        accessibilityLabel={t("statistics.tabs.label")}
        value={kind}
        onChange={onKindChange}
        options={[
          {
            value: "workouts",
            label: t("statistics.tabs.workouts"),
            testID: "statistics-tab-workouts",
          },
          {
            value: "strength-tests",
            label: t("statistics.tabs.powerTest"),
            testID: "statistics-tab-tests",
          },
        ]}
      />
      <Box flexDirection="row" alignItems="center" gap="s">
        <Box flex={1}>
          <ChoiceChips
            size="compact"
            accessibilityLabel={t("statistics.workouts.scalesLabel")}
            value={scale}
            onChange={(value) => {
              if (isScale(value)) setScale(value);
            }}
            options={SCALES.map((option) => ({
              value: option,
              label: t(`statistics.workouts.scalesShort.${option}`),
              accessibilityLabel: t(`statistics.workouts.scales.${option}`),
            }))}
          />
        </Box>
        <StatisticsExportButton kind={kind} scale={scale} />
      </Box>
    </Box>
  );
};

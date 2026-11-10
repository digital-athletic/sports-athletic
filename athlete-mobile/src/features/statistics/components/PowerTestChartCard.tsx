import { PowerTest as Chart } from "@/charts/PowerTest";
import { Coaching } from "@/common/Coaching";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

interface PowerTestChartCardProps {
  hasChartData: boolean;
  /** Undefined shows the whole history. */
  scale?: ScaleType;
}

const LegendPill: FC<{ label: string; color: string }> = ({ label, color }) => (
  <Box
    flexDirection="row"
    alignItems="center"
    gap="xs"
    paddingHorizontal="s"
    paddingVertical="xs"
    borderRadius="round"
    backgroundColor="surfaceSubtle"
  >
    <Box
      width={8}
      height={8}
      borderRadius="round"
      style={{ backgroundColor: color }}
    />
    <Text variant="xSmall" color="darkGrey3">
      {label}
    </Text>
  </Box>
);

const Legend: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const items = [
    { label: t("statistics.powerTest.legendSquad"), color: colors.squad },
    { label: t("statistics.powerTest.legendDeadlift"), color: colors.deadlift },
    {
      label: t("statistics.powerTest.legendBenchPress"),
      color: colors.benchPress,
    },
    { label: t("statistics.powerTest.legendRowing"), color: colors.rowing },
    {
      label: t("statistics.powerTest.legendShoulderPress"),
      color: colors.shoulderPress,
    },
  ];

  return (
    <Box
      flexDirection="row"
      flexWrap="wrap"
      gap="xs"
      paddingHorizontal="m"
      testID="power-test-legend"
    >
      {items.map((item) => (
        <LegendPill key={item.label} label={item.label} color={item.color} />
      ))}
    </Box>
  );
};

/** The strength test chart and its legend pills in one card, or the gym hint without data. */
export const PowerTestChartCard: FC<PowerTestChartCardProps> = ({
  hasChartData,
  scale,
}) => {
  const { t } = useTranslation();

  if (!hasChartData) {
    return <Coaching text={t("statistics.powerTest.gymOnly")} />;
  }

  return (
    <Box
      backgroundColor="white"
      borderWidth={1.5}
      borderColor="lightGrey2"
      borderRadius="xl"
      paddingBottom="m"
      overflow="hidden"
      testID="power-test-chart-card"
    >
      <Chart scale={scale} />
      <Legend />
    </Box>
  );
};

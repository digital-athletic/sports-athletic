import { PowerTest as Chart } from "@/charts/PowerTest";
import { Coaching } from "@/common/Coaching";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { POWER_TEST_EXERCISES } from "@/features/statistics/models/powerTestExercises";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
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
    backgroundColor="surfaceContainer"
  >
    <Box
      width={8}
      height={8}
      borderRadius="round"
      style={{ backgroundColor: color }}
    />
    <Text variant="xSmall" color="onSurface">
      {label}
    </Text>
  </Box>
);

const Legend: FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box
      flexDirection="row"
      flexWrap="wrap"
      gap="xs"
      paddingHorizontal="m"
      testID="power-test-legend"
    >
      {POWER_TEST_EXERCISES.map((exercise) => (
        <LegendPill
          key={exercise.direction}
          label={t(exercise.legendKey)}
          color={colors[exercise.color]}
        />
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
    <Card
      variant="outlined"
      paddingBottom="m"
      overflow="hidden"
      testID="power-test-chart-card"
    >
      <Chart scale={scale} />
      <Legend />
    </Card>
  );
};

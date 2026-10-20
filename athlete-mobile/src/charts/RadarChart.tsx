import type { UserSkills } from "@/features/statistics/models/WorkoutsData";
import type { FocusArea } from "@/schemas/sync.schema";
import { Box } from "@/theme/Box";
import { getHexagonPoints } from "@/utils/geometry";
import { Image } from "expo-image";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { RadarChart as GiftedRadarChart } from "react-native-gifted-charts";
import Svg, { Polygon } from "react-native-svg";
import {
  RADAR_CHART_COLORS,
  RADAR_CHART_DATA,
  RADAR_CHART_LABEL_CONFIG,
  RADAR_CHART_LAYOUT,
  RADAR_CHART_SIZING,
} from "./radarChartConfig";
import { calculatePercentages, SKILL_ORDER } from "./radarChartUtils";

type RadarChartProps = {
  userSkills: UserSkills;
};

/**
 * RadarChart component displays user skill distribution in a circular radar chart.
 * Shows 6 skill axes: Mobility, Prevention, Cardio, Stability, Warmup, and SWR (Strength).
 */
export const RadarChart: FC<RadarChartProps> = ({ userSkills }) => {
  const { t } = useTranslation();

  const percentages = calculatePercentages(userSkills);

  // Transform percentages to data array in SKILL_ORDER
  // Add centerOffset so polygon doesn't collapse to center, cap at maxValue
  const chartData = SKILL_ORDER.map((skill) =>
    Math.min(
      percentages[skill] + RADAR_CHART_DATA.centerOffset,
      RADAR_CHART_DATA.maxValue,
    ),
  );

  // Create labels with skill name and percentage on separate lines
  const labels = SKILL_ORDER.map((skill: FocusArea) => {
    const skillName = t(`statistics.workouts.radarChart.${skill}`) as string;
    const percentage = `${Math.round(percentages[skill])}%`;
    return `${skillName}\n${percentage}`;
  });

  // Label config - all centered at their positions with dark text
  const labelConfigArray = SKILL_ORDER.map(() => ({
    fontSize: RADAR_CHART_LABEL_CONFIG.fontSize,
    stroke: RADAR_CHART_COLORS.labelText,
    textAnchor: RADAR_CHART_LABEL_CONFIG.textAnchor,
  }));

  const summary = t("statistics.workouts.radarChart.summary", {
    values: labels.map((label) => label.replace("\n", " ")).join(", "),
  });

  return (
    <Box
      testID="radar-chart-container"
      alignItems="center"
      width="100%"
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary}
    >
      <View style={styles.chartWrapper}>
        <GiftedRadarChart
          data={chartData}
          maxValue={RADAR_CHART_DATA.maxValue}
          chartSize={RADAR_CHART_SIZING.chartSize}
          noOfSections={RADAR_CHART_DATA.sections}
          labels={labels}
          labelConfigArray={labelConfigArray}
          labelsPositionOffset={RADAR_CHART_DATA.labelsPositionOffset}
          circular={true}
          polygonConfig={{
            stroke: RADAR_CHART_COLORS.primary,
            strokeWidth: 3,
            fill: RADAR_CHART_COLORS.polygonFill,
          }}
          gridConfig={{
            stroke: RADAR_CHART_COLORS.grid,
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            fill: "transparent",
            showGradient: false,
          }}
          asterLinesConfig={{
            stroke: RADAR_CHART_COLORS.grid,
            strokeWidth: 1,
            strokeDashArray: [4, 4],
          }}
          hideGrid={false}
          hideLabels={false}
          hideAsterLines={false}
          startAngle={90}
          isClockWise={true}
          chartContainerProps={{
            width: RADAR_CHART_SIZING.containerWidth,
            height: RADAR_CHART_SIZING.containerHeight,
            shiftX: RADAR_CHART_LAYOUT.shiftX,
            shiftY: RADAR_CHART_LAYOUT.shiftY,
          }}
        />
        <View style={styles.logoContainer}>
          <Svg
            width={RADAR_CHART_SIZING.logoBorderSize}
            height={RADAR_CHART_SIZING.logoBorderSize}
          >
            <Polygon
              points={getHexagonPoints(RADAR_CHART_SIZING.logoBorderSize)}
              fill={RADAR_CHART_COLORS.logoBackground}
              stroke={RADAR_CHART_COLORS.primary}
              strokeWidth={2}
            />
          </Svg>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/img/logos/SA_dark.png")}
              style={styles.logo}
              contentFit="contain"
              accessible={false}
            />
          </View>
        </View>
      </View>
    </Box>
  );
};

// Calculate logo center position based on chart center
// Chart center = shiftX + chartSize/2, shiftY + chartSize/2
// Logo position = chartCenter - logoBorderSize/2
const LOGO_CENTER_X =
  RADAR_CHART_LAYOUT.shiftX +
  RADAR_CHART_SIZING.chartSize / 2 -
  RADAR_CHART_SIZING.logoBorderSize / 2;
const LOGO_CENTER_Y =
  RADAR_CHART_LAYOUT.shiftY +
  RADAR_CHART_SIZING.chartSize / 2 -
  RADAR_CHART_SIZING.logoBorderSize / 2;

const styles = StyleSheet.create({
  chartWrapper: {
    position: "relative",
  },
  logoContainer: {
    position: "absolute",
    top: LOGO_CENTER_Y,
    left: LOGO_CENTER_X,
    width: RADAR_CHART_SIZING.logoBorderSize,
    height: RADAR_CHART_SIZING.logoBorderSize,
  },
  logoWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RADAR_CHART_SIZING.logoBorderSize,
    height: RADAR_CHART_SIZING.logoBorderSize,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: RADAR_CHART_SIZING.logoSize,
    height: RADAR_CHART_SIZING.logoSize,
  },
});

import type { UserSkills } from "@/features/statistics/models/WorkoutsData";
import type { FocusArea } from "@/schemas/sync.schema";
import { Box } from "@/theme/Box";
import { getHexagonPoints } from "@/utils/geometry";
import { Image } from "expo-image";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Text, TSpan } from "react-native-svg";
import {
  RADAR_CHART_COLORS,
  RADAR_CHART_DATA,
  RADAR_CHART_LABEL_CONFIG,
  RADAR_CHART_LAYOUT,
  RADAR_CHART_SIZING,
} from "./radarChartConfig";
import { buildRadarGeometry } from "./radarChartGeometry";
import { calculatePercentages, SKILL_ORDER } from "./radarChartUtils";
import { SVG_FONT_FAMILY, toSvgPoints } from "./svgChart";

const LABEL_LINE_HEIGHT = RADAR_CHART_LABEL_CONFIG.fontSize * 1.2;

type RadarChartProps = {
  userSkills: UserSkills;
};

/**
 * The athlete's skill distribution on 6 axes: Mobility, Prevention, Cardio,
 * Stability, Warmup and SWR (strength).
 */
export const RadarChart: FC<RadarChartProps> = ({ userSkills }) => {
  const { t } = useTranslation();

  const percentages = calculatePercentages(userSkills);

  // The center offset moves a zero skill away from the center point.
  const chartData = SKILL_ORDER.map((skill) =>
    Math.min(
      percentages[skill] + RADAR_CHART_DATA.centerOffset,
      RADAR_CHART_DATA.maxValue,
    ),
  );

  const geometry = buildRadarGeometry({
    values: chartData,
    maxValue: RADAR_CHART_DATA.maxValue,
    sections: RADAR_CHART_DATA.sections,
    size: RADAR_CHART_LAYOUT.gridSize,
    // labelsPositionOffset is in chart values: the labels are 15 of 50 beyond the grid.
    labelOffset:
      (RADAR_CHART_LAYOUT.gridSize / 2) *
      (RADAR_CHART_DATA.labelsPositionOffset / RADAR_CHART_DATA.maxValue),
  });

  const labels = SKILL_ORDER.map((skill: FocusArea) => ({
    name: t(`statistics.workouts.radarChart.${skill}`) as string,
    percentage: `${Math.round(percentages[skill])}%`,
  }));

  const summary = t("statistics.workouts.radarChart.summary", {
    values: labels
      .map((label) => `${label.name} ${label.percentage}`)
      .join(", "),
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
        <Svg
          width={RADAR_CHART_SIZING.containerWidth}
          height={RADAR_CHART_SIZING.containerHeight}
        >
          <G
            transform={`translate(${RADAR_CHART_LAYOUT.shiftX + RADAR_CHART_LAYOUT.gridInset}, ${RADAR_CHART_LAYOUT.shiftY + RADAR_CHART_LAYOUT.gridInset})`}
          >
            {geometry.gridRadii.map((radius) => (
              <Circle
                key={radius}
                cx={geometry.center.x}
                cy={geometry.center.y}
                r={radius}
                stroke={RADAR_CHART_COLORS.grid}
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="transparent"
              />
            ))}
            {geometry.axisEnds.map((end, index) => (
              <Line
                key={SKILL_ORDER[index]}
                x1={geometry.center.x}
                y1={geometry.center.y}
                x2={end.x}
                y2={end.y}
                stroke={RADAR_CHART_COLORS.grid}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
            <Polygon
              testID="radar-chart-polygon"
              points={toSvgPoints(geometry.polygon)}
              stroke={RADAR_CHART_COLORS.primary}
              strokeWidth={3}
              fill={RADAR_CHART_COLORS.polygonFill}
            />
            {geometry.labelAnchors.map((anchor, index) => (
              <Text
                key={SKILL_ORDER[index]}
                x={anchor.x}
                y={anchor.y}
                fontSize={RADAR_CHART_LABEL_CONFIG.fontSize}
                fontFamily={SVG_FONT_FAMILY}
                fill={RADAR_CHART_COLORS.labelText}
                textAnchor={RADAR_CHART_LABEL_CONFIG.textAnchor}
              >
                <TSpan x={anchor.x}>{labels[index].name}</TSpan>
                <TSpan x={anchor.x} dy={LABEL_LINE_HEIGHT}>
                  {labels[index].percentage}
                </TSpan>
              </Text>
            ))}
          </G>
        </Svg>
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

// Top left corner of the logo, so the logo is centered on the chart.
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

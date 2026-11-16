import { usePowerTestData } from "@/features/statistics/hooks/usePowerTestData";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { Platform, useWindowDimensions } from "react-native";
import Svg, { G, Line, Polyline, Text } from "react-native-svg";
import {
  LINE_CHART_AXIS,
  LINE_CHART_COLORS,
  LINE_CHART_LABELS,
  LINE_CHART_SIZING,
  LINE_CHART_STYLE,
} from "./lineChartConfig";
import { calculateYAxisMax } from "./lineChartUtils";
import {
  buildPowerTestGeometry,
  type PowerTestPoint,
} from "./powerTestGeometry";

interface PowerTestChartProps {
  /** Undefined shows the whole history. */
  scale?: ScaleType;
}

// The browser renders SVG text in a serif font unless the family is named.
const AXIS_FONT_FAMILY = Platform.select({
  web: "system-ui, -apple-system, sans-serif",
  default: undefined,
});
const PLOT_PADDING_TOP = 8;
const X_LABELS_HEIGHT = 50;
const Y_LABEL_GAP = 4;
const X_LABEL_OFFSET = 18;

const toPolylinePoints = (points: PowerTestPoint[]): string =>
  points.map(({ x, y }) => `${x},${y}`).join(" ");

/**
 * LineChart component for Power Test statistics.
 * Displays 5 exercise metrics (Squat, Deadlift, Bench Press, Rowing, Shoulder Press) over time.
 */
export const PowerTest: FC<PowerTestChartProps> = ({ scale }) => {
  const { chartData } = usePowerTestData({ scale });
  const { width: screenWidth } = useWindowDimensions();

  // Don't render chart if no data (parent component shows Coaching message)
  if (chartData.dates.length === 0) {
    return null;
  }

  // Chart width with right margin
  const chartWidth = screenWidth - 100;
  const plot = {
    width:
      chartWidth -
      LINE_CHART_SIZING.yAxisLabelWidth -
      LINE_CHART_LABELS.endSpacing,
    height: LINE_CHART_SIZING.chartHeight,
  };
  // The rules and the x axis also run under the room kept for the last date label.
  const axisWidth = plot.width + LINE_CHART_LABELS.endSpacing;
  const geometry = buildPowerTestGeometry({
    chartData,
    yAxisMax: calculateYAxisMax(chartData),
    plot,
  });

  return (
    <Box
      testID="power-test-line-chart"
      alignSelf="stretch"
      paddingHorizontal="m"
      marginTop="m"
      marginRight={"m"}
    >
      <Svg
        width={chartWidth}
        height={PLOT_PADDING_TOP + plot.height + X_LABELS_HEIGHT}
      >
        <G
          transform={`translate(${LINE_CHART_SIZING.yAxisLabelWidth}, ${PLOT_PADDING_TOP})`}
        >
          {geometry.yTicks.map((tick) => (
            <G key={tick.value}>
              <Line
                x1={0}
                x2={axisWidth}
                y1={tick.y}
                y2={tick.y}
                stroke={LINE_CHART_COLORS.grid}
                strokeWidth={LINE_CHART_AXIS.rulesThickness}
              />
              <Text
                x={-Y_LABEL_GAP}
                y={tick.y + LINE_CHART_AXIS.fontSize / 3}
                fontSize={LINE_CHART_AXIS.fontSize}
                fontFamily={AXIS_FONT_FAMILY}
                fill={LINE_CHART_COLORS.axisText}
                textAnchor="end"
              >
                {`${tick.value}${LINE_CHART_AXIS.yAxisSuffix}`}
              </Text>
            </G>
          ))}
          <Line
            x1={0}
            x2={axisWidth}
            y1={plot.height}
            y2={plot.height}
            stroke={LINE_CHART_COLORS.axisLine}
            strokeWidth={1}
          />
          <Line
            x1={0}
            x2={0}
            y1={0}
            y2={plot.height}
            stroke={LINE_CHART_COLORS.axisLine}
            strokeWidth={1}
          />
          {geometry.xLabels.map((xLabel) => (
            <Text
              key={`${xLabel.x}-${xLabel.label}`}
              x={xLabel.x}
              y={plot.height + X_LABEL_OFFSET}
              fontSize={LINE_CHART_AXIS.fontSize}
              fontFamily={AXIS_FONT_FAMILY}
              fill={LINE_CHART_COLORS.axisText}
              textAnchor="middle"
            >
              {xLabel.label}
            </Text>
          ))}
          {geometry.series.map((series) => (
            <Polyline
              key={series.key}
              testID={`power-test-line-${series.key}`}
              points={toPolylinePoints(series.points)}
              fill="none"
              stroke={LINE_CHART_COLORS[series.key]}
              strokeWidth={LINE_CHART_STYLE.thickness}
            />
          ))}
        </G>
      </Svg>
    </Box>
  );
};

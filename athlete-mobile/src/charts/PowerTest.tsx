import { usePowerTestData } from "@/features/statistics/hooks/usePowerTestData";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import {
  LINE_CHART_AXIS,
  LINE_CHART_COLORS,
  LINE_CHART_DATA,
  LINE_CHART_LABELS,
  LINE_CHART_SIZING,
  LINE_CHART_STYLE,
} from "./lineChartConfig";
import {
  calculateSpacing,
  calculateYAxisMax,
  transformToLineData,
} from "./lineChartUtils";

interface PowerTestChartProps {
  /** Undefined shows the whole history. */
  scale?: ScaleType;
}

/**
 * LineChart component for Power Test statistics.
 * Displays 5 exercise metrics (Squat, Deadlift, Bench Press, Rowing, Shoulder Press) over time.
 */
export const PowerTest: FC<PowerTestChartProps> = ({ scale }) => {
  const { chartData } = usePowerTestData({ scale });
  const { width: screenWidth } = useWindowDimensions();

  // Chart width with right margin
  const chartWidth = screenWidth - 100;

  // Transform data for LineChart (labels embedded in primary series, max 6 visible)
  const lineData = transformToLineData(chartData);

  // Calculate Y-axis maximum
  const yAxisMax = calculateYAxisMax(chartData);

  // Calculate spacing to fill the chart width
  const spacing = calculateSpacing(
    chartData.dates.length,
    chartWidth,
    LINE_CHART_SIZING.yAxisOffset,
    LINE_CHART_LABELS.endSpacing,
  );

  // Don't render chart if no data (parent component shows Coaching message)
  if (chartData.dates.length === 0) {
    return null;
  }

  return (
    <Box
      testID="power-test-line-chart"
      alignSelf="stretch"
      paddingHorizontal="m"
      marginTop="m"
      marginRight={"m"}
    >
      <LineChart
        // Data series
        data={lineData.squad}
        data2={lineData.deadlift}
        data3={lineData.benchPress}
        data4={lineData.rowing}
        data5={lineData.shoulderPress}
        // Sizing
        height={LINE_CHART_SIZING.chartHeight}
        width={chartWidth}
        initialSpacing={LINE_CHART_SIZING.yAxisOffset}
        spacing={spacing}
        endSpacing={0}
        // Line colors
        color={LINE_CHART_COLORS.squad}
        color2={LINE_CHART_COLORS.deadlift}
        color3={LINE_CHART_COLORS.benchPress}
        color4={LINE_CHART_COLORS.rowing}
        color5={LINE_CHART_COLORS.shoulderPress}
        // Line styling
        thickness={LINE_CHART_STYLE.thickness}
        thickness2={LINE_CHART_STYLE.thickness}
        thickness3={LINE_CHART_STYLE.thickness}
        thickness4={LINE_CHART_STYLE.thickness}
        thickness5={LINE_CHART_STYLE.thickness}
        curved={LINE_CHART_STYLE.curved}
        areaChart={LINE_CHART_STYLE.areaChart}
        // Data points (hidden to match design)
        hideDataPoints
        hideDataPoints2
        hideDataPoints3
        hideDataPoints4
        hideDataPoints5
        yAxisTextStyle={{
          color: LINE_CHART_COLORS.axisText,
          fontSize: LINE_CHART_AXIS.fontSize,
        }}
        yAxisLabelSuffix={LINE_CHART_AXIS.yAxisSuffix}
        yAxisOffset={0}
        yAxisLabelWidth={LINE_CHART_SIZING.yAxisLabelWidth}
        // X-axis labels are embedded in data items via label and showXAxisIndex
        xAxisLabelTextStyle={{
          color: LINE_CHART_COLORS.axisText,
          fontSize: LINE_CHART_AXIS.fontSize,
          marginLeft: 10,
        }}
        labelsExtraHeight={30}
        xAxisColor={LINE_CHART_COLORS.axisLine}
        yAxisColor={LINE_CHART_COLORS.axisLine}
        // Grid configuration
        showVerticalLines={LINE_CHART_AXIS.showVerticalLines}
        rulesType="solid"
        rulesColor={LINE_CHART_COLORS.grid}
        rulesThickness={LINE_CHART_AXIS.rulesThickness}
        // Y-axis scale configuration
        maxValue={yAxisMax}
        noOfSections={yAxisMax / LINE_CHART_DATA.stepValue}
        // Scroll behavior (disabled for small datasets)
        scrollToEnd={false}
        isAnimated={false}
      />
    </Box>
  );
};

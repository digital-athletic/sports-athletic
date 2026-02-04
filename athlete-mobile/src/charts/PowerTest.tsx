import { usePowerTestData } from "@/features/statistics/hooks/usePowerTestData";
import { Box } from "@/theme/Box";
import { type FC, useMemo } from "react";
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

/**
 * LineChart component for Power Test statistics.
 * Displays 4 exercise metrics (Squat, Bench Press, Rowing, Shoulder Press) over time.
 */
export const PowerTest: FC = () => {
  const { chartData } = usePowerTestData();
  const { width: screenWidth } = useWindowDimensions();

  // Chart width with right margin
  const chartWidth = screenWidth - 100;

  // Transform data for LineChart (labels embedded in primary series, max 6 visible)
  const lineData = useMemo(() => transformToLineData(chartData), [chartData]);

  // Calculate Y-axis maximum
  const yAxisMax = useMemo(() => calculateYAxisMax(chartData), [chartData]);

  // Calculate spacing to fill the chart width
  const spacing = useMemo(
    () =>
      calculateSpacing(
        chartData.dates.length,
        chartWidth,
        LINE_CHART_SIZING.yAxisOffset,
        LINE_CHART_LABELS.endSpacing,
      ),
    [chartData.dates.length, chartWidth],
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
        data2={lineData.benchPress}
        data3={lineData.rowing}
        data4={lineData.shoulderPress}
        // Sizing
        height={LINE_CHART_SIZING.chartHeight}
        width={chartWidth}
        initialSpacing={LINE_CHART_SIZING.yAxisOffset}
        spacing={spacing}
        endSpacing={0}
        // Line colors
        color={LINE_CHART_COLORS.squad}
        color2={LINE_CHART_COLORS.benchPress}
        color3={LINE_CHART_COLORS.rowing}
        color4={LINE_CHART_COLORS.shoulderPress}
        // Line styling
        thickness={LINE_CHART_STYLE.thickness}
        thickness2={LINE_CHART_STYLE.thickness}
        thickness3={LINE_CHART_STYLE.thickness}
        thickness4={LINE_CHART_STYLE.thickness}
        curved={LINE_CHART_STYLE.curved}
        areaChart={LINE_CHART_STYLE.areaChart}
        // Data points (hidden to match design)
        hideDataPoints
        hideDataPoints2
        hideDataPoints3
        hideDataPoints4
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

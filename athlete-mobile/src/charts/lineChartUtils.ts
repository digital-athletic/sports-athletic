import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import { formatDateTick } from "@/features/statistics/models/ChartData";
import { LINE_CHART_DATA, LINE_CHART_LABELS } from "./lineChartConfig";

/**
 * Data item format expected by react-native-gifted-charts LineChart.
 * Labels and visibility are embedded directly on data items.
 */
export interface LineDataItem {
  value: number;
  label?: string;
  showXAxisIndex?: boolean;
}

/**
 * Transformed data for all four exercise lines.
 * Labels are embedded in the primary series (squad).
 */
export interface TransformedLineData {
  squad: LineDataItem[];
  deadlift: LineDataItem[];
  benchPress: LineDataItem[];
  rowing: LineDataItem[];
  shoulderPress: LineDataItem[];
}

/**
 * Calculates the step interval for showing x-axis labels.
 * Shows every Nth label to avoid crowding while keeping first and last visible.
 *
 * @returns Step value (1 = show all, 2 = show every 2nd, etc.)
 */
export const calculateLabelStep = (totalPoints: number): number => {
  const { maxVisibleLabels } = LINE_CHART_LABELS;

  if (totalPoints <= maxVisibleLabels) {
    return 1; // Show all labels
  }

  // Calculate step to show approximately maxVisibleLabels
  return Math.ceil(totalPoints / maxVisibleLabels);
};

/**
 * Determines if a label at the given index should be visible.
 * Shows labels at evenly spaced step intervals.
 */
export const shouldShowLabel = (
  index: number,
  totalPoints: number,
  step: number,
): boolean => {
  // Show if index falls on step interval
  return index % step === 0;
};

/**
 * Transforms PowerTestChartData into the format required by react-native-gifted-charts.
 * X-axis labels are embedded in the primary series (squad) using label and showXAxisIndex.
 * When there are many data points, only up to 6 labels are shown (controlled by showXAxisIndex).
 */
export const transformToLineData = (
  chartData: PowerTestChartData,
): TransformedLineData => {
  const { dates, kneeDominant, deadlift, rowing, benchPress, shoulderPress } =
    chartData;

  const labelStep = calculateLabelStep(dates.length);

  // Primary series with inline labels (library reads labels from data prop)
  const squadData: LineDataItem[] = kneeDominant.map((value, index) => {
    const showLabel = shouldShowLabel(index, dates.length, labelStep);
    return {
      value,
      label: showLabel ? formatDateTick(dates[index]) : undefined,
      showXAxisIndex: false,
    };
  });

  // Secondary series - values only (labels ignored by library)
  const deadliftData: LineDataItem[] = deadlift.map((value) => ({ value }));
  const benchPressData: LineDataItem[] = benchPress.map((value) => ({ value }));
  const rowingData: LineDataItem[] = rowing.map((value) => ({ value }));
  const shoulderPressData: LineDataItem[] = shoulderPress.map((value) => ({
    value,
  }));

  return {
    squad: squadData,
    deadlift: deadliftData,
    benchPress: benchPressData,
    rowing: rowingData,
    shoulderPress: shoulderPressData,
  };
};

/**
 * Calculates the spacing between data points to fill the chart width.
 * This ensures the chart lines use the full available width regardless of data point count.
 *
 * @param dataPointCount - Number of data points in the chart
 * @param chartWidth - Available chart width in pixels
 * @param initialSpacing - Space before the first data point
 * @param endSpacing - Space after the last data point (for label overflow)
 * @returns Calculated spacing between data points
 */
export const calculateSpacing = (
  dataPointCount: number,
  chartWidth: number,
  initialSpacing: number,
  endSpacing: number = 0,
): number => {
  // Need at least 2 points to have spacing between them
  if (dataPointCount <= 1) {
    // For single point, return the full width so the point appears at the end
    return chartWidth - initialSpacing - endSpacing;
  }

  // Calculate spacing to fill the available width
  // Account for initial spacing and end spacing (for label overflow)
  const availableWidth = chartWidth - initialSpacing - endSpacing;
  return availableWidth / (dataPointCount - 1);
};

/**
 * Calculates the optimal Y-axis maximum value based on data.
 * Rounds up to nearest step value (20) and adds padding.
 */
export const calculateYAxisMax = (chartData: PowerTestChartData): number => {
  const allValues = [
    ...chartData.kneeDominant,
    ...chartData.deadlift,
    ...chartData.rowing,
    ...chartData.benchPress,
    ...chartData.shoulderPress,
  ];

  if (allValues.length === 0) {
    return LINE_CHART_DATA.defaultMaxValue;
  }

  const maxValue = Math.max(...allValues);

  if (maxValue === 0) {
    return LINE_CHART_DATA.defaultMaxValue;
  }

  // Round up to nearest step value and add padding
  const paddedMax = maxValue * LINE_CHART_DATA.maxValuePadding;
  const roundedMax =
    Math.ceil(paddedMax / LINE_CHART_DATA.stepValue) *
    LINE_CHART_DATA.stepValue;

  return Math.max(roundedMax, LINE_CHART_DATA.defaultMaxValue);
};

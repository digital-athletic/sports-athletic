import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import { LINE_CHART_DATA, LINE_CHART_LABELS } from "./lineChartConfig";

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

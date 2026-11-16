import { colors } from "@/theme/colors";

/** Chart sizing configuration */
export const LINE_CHART_SIZING = {
  /** Default chart height */
  chartHeight: 200,
  /** Y-axis label width */
  yAxisLabelWidth: 40,
} as const;

/** Chart data configuration */
export const LINE_CHART_DATA = {
  /** Default maximum Y value */
  defaultMaxValue: 120,
  /** Padding added above highest value (percentage) */
  maxValuePadding: 1.1,
  /** Step size for Y-axis labels */
  stepValue: 20,
} as const;

/** Chart color configuration */
export const LINE_CHART_COLORS = {
  /** Squat line color (black) */
  squad: colors.squad,
  /** Deadlift line color (purple) */
  deadlift: colors.deadlift,
  /** Bench Press line color (green) */
  benchPress: colors.benchPress,
  /** Rowing line color (blue) */
  rowing: colors.rowing,
  /** Shoulder Press line color (pink) */
  shoulderPress: colors.shoulderPress,
  /** Grid/rules line color */
  grid: colors.lightGrey2,
  /** Axis label text color */
  axisText: colors.darkGrey2,
  /** Axis line color */
  axisLine: colors.black,
} as const;

/** Line styling configuration */
export const LINE_CHART_STYLE = {
  /** Line thickness */
  thickness: 2,
} as const;

/** Axis styling configuration */
export const LINE_CHART_AXIS = {
  /** Font size for axis labels */
  fontSize: 11,
  /** Y-axis label suffix (unit displayed after each Y-axis value) */
  yAxisSuffix: " kg",
  /** Rules line thickness */
  rulesThickness: 1,
} as const;

/** X-axis label configuration for handling crowded labels */
export const LINE_CHART_LABELS = {
  /** Maximum number of x-axis labels to display (prevents crowding) */
  maxVisibleLabels: 6,
  /** End spacing to prevent last label from being cut off (accounts for label width) */
  endSpacing: 35,
} as const;

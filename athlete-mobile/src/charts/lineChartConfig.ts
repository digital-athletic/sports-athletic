import { colors } from "@/theme/colors";

/** Chart sizing configuration */
export const LINE_CHART_SIZING = {
  /** Default chart height */
  chartHeight: 200,
  /** Y-axis label width */
  yAxisLabelWidth: 40,
  /** Y-axis offset from left edge (initial spacing for first data point) */
  yAxisOffset: 5,
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
  /** Data point radius (0 = no visible points, matching design) */
  dataPointRadius: 0,
  /** Whether to curve the lines */
  curved: false,
  /** Whether to show area fill under lines */
  areaChart: false,
} as const;

/** Axis styling configuration */
export const LINE_CHART_AXIS = {
  /** Font size for axis labels */
  fontSize: 11,
  /** Y-axis label suffix (unit displayed after each Y-axis value) */
  yAxisSuffix: " kg",
  /** Whether to show vertical grid lines */
  showVerticalLines: false,
  /** Whether to show horizontal grid lines (rules) */
  showRules: true,
  /** Rules line dash array [dashLength, gapLength] */
  rulesDashArray: [0, 0],
  /** Rules line thickness */
  rulesThickness: 1,
} as const;

/** X-axis label configuration for handling crowded labels */
export const LINE_CHART_LABELS = {
  /** Maximum number of x-axis labels to display (prevents crowding) */
  maxVisibleLabels: 6,
  /** Vertical shift to position labels below the x-axis line (positive = down) */
  verticalShift: 10,
  /** Height of x-axis labels container */
  labelsHeight: 50,
  /** Horizontal shift for x-axis labels (negative = left, aligns label start with data point) */
  labelShiftX: 0,
  /** End spacing to prevent last label from being cut off (accounts for label width) */
  endSpacing: 35,
} as const;

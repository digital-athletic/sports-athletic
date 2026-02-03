import { colors } from "@/theme/colors";

/** Chart sizing configuration */
export const RADAR_CHART_SIZING = {
  /** Main chart diameter */
  chartSize: 220,
  /** Center logo diameter */
  logoSize: 40,
  /** Hexagon border around logo */
  logoBorderSize: 55,
  /** Container width (larger than chart for labels) */
  containerWidth: 330,
  /** Container height */
  containerHeight: 270,
} as const;

/** Derived sizing values */
export const RADAR_CHART_LAYOUT = {
  /** Horizontal shift to center chart in container */
  shiftX:
    (RADAR_CHART_SIZING.containerWidth - RADAR_CHART_SIZING.chartSize) / 2,
  /** Vertical shift to center chart in container */
  shiftY:
    (RADAR_CHART_SIZING.containerHeight - RADAR_CHART_SIZING.chartSize) / 2,
} as const;

/** Chart data configuration */
export const RADAR_CHART_DATA = {
  /** Offset added to values so polygon doesn't collapse to center */
  centerOffset: 10,
  /** Maximum value for chart scale */
  maxValue: 50,
  /** Number of grid sections */
  sections: 2,
  /** Label offset from chart edge */
  labelsPositionOffset: 15,
} as const;

/**
 * Creates polygon fill color with specified opacity.
 * Uses primary color as base.
 */
const createPrimaryWithOpacity = (opacity: number): string => {
  // Convert hex #C71B1B to rgba
  const hex = colors.primary.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** Chart color configuration */
export const RADAR_CHART_COLORS = {
  /** Primary stroke color */
  primary: colors.primary,
  /** Polygon fill with transparency */
  polygonFill: createPrimaryWithOpacity(0.3),
  /** Grid line color */
  grid: colors.lightGrey3,
  /** Label text color */
  labelText: colors.darkGrey3,
  /** Logo background color */
  logoBackground: colors.white,
} as const;

/** Static label configuration for all 6 skills */
export const RADAR_CHART_LABEL_CONFIG = {
  fontSize: 11,
  textAnchor: "middle" as const,
} as const;

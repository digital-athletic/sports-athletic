import { type FC, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, G, Line, Polyline, Rect, Text } from "react-native-svg";
import { formatRangeNumber } from "@/features/performanceTests/referenceRange";
import { Box } from "@/theme/Box";
import { useTheme } from "@/theme/theme";
import { formatDateForDisplay } from "@/utils/date";
import {
  buildRangeLineGeometry,
  type ChartSize,
  type RangeLineGeometry,
  type RangeLinePoint,
} from "./rangeLineChartUtils";

type RangeLineChartProps = {
  points: RangeLinePoint[];
  unit: string;
  testID?: string;
};

type Sizes = {
  height: number;
  fontSize: number;
  lineWidth: number;
  dotRadius: number;
};

const SIZES: Record<"phone" | "tablet", Sizes> = {
  phone: { height: 220, fontSize: 11, lineWidth: 2.5, dotRadius: 4.5 },
  tablet: { height: 320, fontSize: 15, lineWidth: 3.5, dotRadius: 6.5 },
};
const BAND_OPACITY = 0.18;
// The browser renders SVG text in a serif font unless the family is named.
const AXIS_FONT_FAMILY = Platform.select({
  web: "system-ui, -apple-system, sans-serif",
  default: undefined,
});
const AXIS_LABEL_GAP = 14;
const PLOT_PADDING_TOP = 12;
const PLOT_PADDING_RIGHT = 12;

type PartProps = { geometry: RangeLineGeometry; plot: ChartSize };

const Bands: FC<Pick<PartProps, "geometry"> & { testID?: string }> = ({
  geometry,
  testID,
}) => {
  const { colors } = useTheme();

  return geometry.bands.map((band) => (
    <Rect
      key={band.x}
      x={band.x}
      y={band.y}
      width={band.width}
      height={band.height}
      fill={colors.success}
      fillOpacity={BAND_OPACITY}
      testID={testID && `${testID}-band`}
    />
  ));
};

const YAxis: FC<PartProps & { unit: string; fontSize: number }> = ({
  geometry,
  plot,
  unit,
  fontSize,
}) => {
  const { i18n } = useTranslation();
  const { colors } = useTheme();

  return geometry.yTicks.map((tick) => (
    <G key={tick.value}>
      <Line
        x1={0}
        x2={plot.width}
        y1={tick.y}
        y2={tick.y}
        stroke={colors.lightGrey2}
        strokeWidth={1}
      />
      <Text
        x={-AXIS_LABEL_GAP}
        y={tick.y + fontSize / 3}
        fontSize={fontSize}
        fontFamily={AXIS_FONT_FAMILY}
        fill={colors.darkGrey2}
        textAnchor="end"
      >
        {`${formatRangeNumber(tick.value, i18n.language)} ${unit}`}
      </Text>
    </G>
  ));
};

/** The first and the last date below the plot, one centred date when both are equal. */
const XAxis: FC<
  Pick<PartProps, "plot"> & { points: RangeLinePoint[]; fontSize: number }
> = ({ plot, points, fontSize }) => {
  const { colors } = useTheme();
  const firstDate = points[0].date;
  const lastDate = points[points.length - 1].date;
  const labels =
    firstDate === lastDate
      ? [{ date: firstDate, x: plot.width / 2, anchor: "middle" as const }]
      : [
          { date: firstDate, x: 0, anchor: "start" as const },
          { date: lastDate, x: plot.width, anchor: "end" as const },
        ];

  return labels.map((label) => (
    <Text
      key={label.anchor}
      x={label.x}
      y={plot.height + fontSize * 1.8}
      fontSize={fontSize}
      fontFamily={AXIS_FONT_FAMILY}
      fill={colors.darkGrey2}
      textAnchor={label.anchor}
    >
      {formatDateForDisplay(label.date)}
    </Text>
  ));
};

const ValueLine: FC<
  Pick<PartProps, "geometry"> & { points: RangeLinePoint[] } & Pick<
      Sizes,
      "lineWidth" | "dotRadius"
    >
> = ({ geometry, points, lineWidth, dotRadius }) => {
  const { colors } = useTheme();

  return (
    <>
      <Polyline
        points={geometry.line.map(({ x, y }) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={colors.primary}
        strokeWidth={lineWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {geometry.line.map(({ x, y }, index) => (
        <Circle
          key={`${points[index].date}-${index}`}
          cx={x}
          cy={y}
          r={dotRadius}
          fill={colors.primary}
          stroke={colors.white}
          strokeWidth={2}
        />
      ))}
    </>
  );
};

/**
 * Values over time as a line with dots. The reference range of each stretch is a
 * light green band behind the line. Points must be ordered oldest first.
 */
export const RangeLineChart: FC<RangeLineChartProps> = ({
  points,
  unit,
  testID,
}) => {
  const { t } = useTranslation();
  const { breakpoints } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const { height, fontSize, lineWidth, dotRadius } =
    windowWidth >= breakpoints.tablet ? SIZES.tablet : SIZES.phone;

  if (points.length === 0) return null;

  // Room for the widest tick label, e.g. "10.35 s".
  const paddingLeft = Math.ceil(fontSize * 5.5) + AXIS_LABEL_GAP;
  const paddingBottom = fontSize * 2.5;
  const plot = {
    width: Math.max(width - paddingLeft - PLOT_PADDING_RIGHT, 0),
    height: height - PLOT_PADDING_TOP - paddingBottom,
  };
  const geometry = buildRangeLineGeometry(points, plot);

  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  return (
    <Box
      onLayout={handleLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t("more.performanceTests.chartSummary", {
        count: points.length,
      })}
      testID={testID}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <G x={paddingLeft} y={PLOT_PADDING_TOP}>
            <Bands geometry={geometry} testID={testID} />
            <YAxis
              geometry={geometry}
              plot={plot}
              unit={unit}
              fontSize={fontSize}
            />
            <ValueLine
              geometry={geometry}
              points={points}
              lineWidth={lineWidth}
              dotRadius={dotRadius}
            />
            <XAxis plot={plot} points={points} fontSize={fontSize} />
          </G>
        </Svg>
      )}
    </Box>
  );
};

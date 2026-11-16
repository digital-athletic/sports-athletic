import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import { formatDateTick } from "@/features/statistics/models/ChartData";
import { LINE_CHART_DATA } from "./lineChartConfig";
import { calculateLabelStep, shouldShowLabel } from "./lineChartUtils";

export type PowerTestSeriesKey =
  | "squad"
  | "deadlift"
  | "benchPress"
  | "rowing"
  | "shoulderPress";

export interface PowerTestPoint {
  x: number;
  y: number;
}

export interface PowerTestSeries {
  key: PowerTestSeriesKey;
  points: PowerTestPoint[];
}

export interface PowerTestYTick {
  value: number;
  y: number;
}

export interface PowerTestXLabel {
  label: string;
  x: number;
}

export interface PowerTestGeometry {
  series: PowerTestSeries[];
  yTicks: PowerTestYTick[];
  xLabels: PowerTestXLabel[];
}

export interface BuildPowerTestGeometryInput {
  chartData: PowerTestChartData;
  yAxisMax: number;
  plot: { width: number; height: number };
}

/** x of point `index`: evenly spread from 0 to the plot width, a single point sits at the plot width. */
const xOfIndex = (index: number, count: number, plotWidth: number): number => {
  if (count <= 1) {
    return plotWidth;
  }
  return (index / (count - 1)) * plotWidth;
};

const yOfValue = (
  value: number,
  yAxisMax: number,
  plotHeight: number,
): number => plotHeight - (value * plotHeight) / yAxisMax;

const buildYTicks = (
  yAxisMax: number,
  plotHeight: number,
): PowerTestYTick[] => {
  const ticks: PowerTestYTick[] = [];
  for (let value = 0; value <= yAxisMax; value += LINE_CHART_DATA.stepValue) {
    ticks.push({ value, y: yOfValue(value, yAxisMax, plotHeight) });
  }
  return ticks;
};

export const buildPowerTestGeometry = ({
  chartData,
  yAxisMax,
  plot,
}: BuildPowerTestGeometryInput): PowerTestGeometry => {
  const { dates } = chartData;
  const valuesByKey: Record<PowerTestSeriesKey, number[]> = {
    squad: chartData.kneeDominant,
    deadlift: chartData.deadlift,
    benchPress: chartData.benchPress,
    rowing: chartData.rowing,
    shoulderPress: chartData.shoulderPress,
  };
  const keys: PowerTestSeriesKey[] = [
    "squad",
    "deadlift",
    "benchPress",
    "rowing",
    "shoulderPress",
  ];

  const series = keys.map((key) => ({
    key,
    points: valuesByKey[key].map((value, index) => ({
      x: xOfIndex(index, valuesByKey[key].length, plot.width),
      y: yOfValue(value, yAxisMax, plot.height),
    })),
  }));

  const labelStep = calculateLabelStep(dates.length);
  const xLabels = dates
    .map((date, index) => ({
      label: formatDateTick(date),
      x: xOfIndex(index, dates.length, plot.width),
      visible: shouldShowLabel(index, dates.length, labelStep),
    }))
    .filter((entry) => entry.visible)
    .map(({ label, x }) => ({ label, x }));

  return { series, yTicks: buildYTicks(yAxisMax, plot.height), xLabels };
};

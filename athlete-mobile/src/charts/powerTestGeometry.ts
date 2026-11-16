import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import { formatDateTick } from "@/features/statistics/models/ChartData";
import { LINE_CHART_DATA } from "./lineChartConfig";
import { calculateLabelStep, shouldShowLabel } from "./lineChartUtils";
import { type ChartPoint } from "./svgChart";

export type PowerTestSeriesKey =
  | "squad"
  | "deadlift"
  | "benchPress"
  | "rowing"
  | "shoulderPress";

export interface PowerTestSeries {
  key: PowerTestSeriesKey;
  points: ChartPoint[];
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

/** Spreads the points evenly from 0 to the plot width; a single point is at the plot width. */
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
  // The squat line shows the knee dominant test results.
  const valuesInDrawingOrder: [PowerTestSeriesKey, number[]][] = [
    ["squad", chartData.kneeDominant],
    ["deadlift", chartData.deadlift],
    ["benchPress", chartData.benchPress],
    ["rowing", chartData.rowing],
    ["shoulderPress", chartData.shoulderPress],
  ];

  const series = valuesInDrawingOrder.map(([key, values]) => ({
    key,
    points: values.map((value, index) => ({
      x: xOfIndex(index, values.length, plot.width),
      y: yOfValue(value, yAxisMax, plot.height),
    })),
  }));

  const labelStep = calculateLabelStep(dates.length);
  const xLabels = dates.flatMap((date, index) =>
    shouldShowLabel(index, dates.length, labelStep)
      ? [
          {
            label: formatDateTick(date),
            x: xOfIndex(index, dates.length, plot.width),
          },
        ]
      : [],
  );

  return { series, yTicks: buildYTicks(yAxisMax, plot.height), xLabels };
};

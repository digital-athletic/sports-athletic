import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import { buildPowerTestGeometry } from "./powerTestGeometry";

// Builds chart data with the same value per series, e.g. 3 dates and value 80 gives squat [80, 80, 80]
const generateFlatPowerTestChartData = (
  dates: string[],
  value: number,
): PowerTestChartData => {
  const values = dates.map(() => value);
  return {
    dates,
    kneeDominant: values,
    deadlift: values,
    rowing: values,
    benchPress: values,
    shoulderPress: values,
  };
};

// Builds chart data with distinct values per series, e.g. squat [0, 80, 85] and deadlift [0, 70, 75]
const generateDistinctPowerTestChartData = (): PowerTestChartData => ({
  dates: ["2024-06-30", "2024-07-06", "2024-09-04"],
  kneeDominant: [0, 80, 85],
  deadlift: [0, 70, 75],
  rowing: [0, 50, 55],
  benchPress: [0, 60, 65],
  shoulderPress: [0, 35, 40],
});

const plot = { width: 300, height: 200 };

describe("buildPowerTestGeometry: series", () => {
  it("returns the five series in the order squad, deadlift, benchPress, rowing, shoulderPress", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.series.map((series) => series.key)).toEqual([
      "squad",
      "deadlift",
      "benchPress",
      "rowing",
      "shoulderPress",
    ]);
  });

  it("sources squad from kneeDominant and the other series from their own values", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 100,
      plot: { width: 300, height: 100 },
    });

    const yValuesByKey = Object.fromEntries(
      geometry.series.map((series) => [
        series.key,
        series.points.map((point) => 100 - point.y),
      ]),
    );
    expect(yValuesByKey).toEqual({
      squad: [0, 80, 85],
      deadlift: [0, 70, 75],
      benchPress: [0, 60, 65],
      rowing: [0, 50, 55],
      shoulderPress: [0, 35, 40],
    });
  });

  it("spreads x evenly from 0 to the plot width", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.series[0].points.map((point) => point.x)).toEqual([
      0, 150, 300,
    ]);
  });

  it("maps value 0 to the plot bottom and yAxisMax to the plot top", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateFlatPowerTestChartData(
        ["2024-06-30", "2024-07-06"],
        0,
      ),
      yAxisMax: 120,
      plot,
    });
    const topGeometry = buildPowerTestGeometry({
      chartData: generateFlatPowerTestChartData(
        ["2024-06-30", "2024-07-06"],
        120,
      ),
      yAxisMax: 120,
      plot,
    });

    expect([
      geometry.series[0].points[0].y,
      topGeometry.series[0].points[0].y,
    ]).toEqual([200, 0]);
  });

  it("scales y proportionally to yAxisMax", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 120,
      plot,
    });

    // 200 - 80 / 120 * 200
    expect(geometry.series[0].points[1].y).toBeCloseTo(66.667, 2);
  });

  it("places a single data point at the plot width", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateFlatPowerTestChartData(["2024-07-06"], 60),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.series[0].points).toEqual([{ x: 300, y: 100 }]);
  });

  it("returns empty series without data", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateFlatPowerTestChartData([], 0),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.series.map((series) => series.points)).toEqual([
      [],
      [],
      [],
      [],
      [],
    ]);
  });
});

describe("buildPowerTestGeometry: y ticks", () => {
  it("creates a tick every 20 from 0 to yAxisMax inclusive", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.yTicks.map((tick) => tick.value)).toEqual([
      0, 20, 40, 60, 80, 100, 120,
    ]);
  });

  it("positions the ticks with the same y mapping as the series", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 100,
      plot: { width: 300, height: 100 },
    });

    expect(geometry.yTicks.map((tick) => tick.y)).toEqual([
      100, 80, 60, 40, 20, 0,
    ]);
  });
});

describe("buildPowerTestGeometry: x labels", () => {
  it("labels every point with formatted dates when there are 6 or fewer", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateDistinctPowerTestChartData(),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.xLabels).toEqual([
      { label: "30.06.", x: 0 },
      { label: "06.07.", x: 150 },
      { label: "04.09.", x: 300 },
    ]);
  });

  it("labels every second point when there are 9 points", () => {
    const dates = Array.from({ length: 9 }, (_, i) => `2024-0${i + 1}-01`);
    const geometry = buildPowerTestGeometry({
      chartData: generateFlatPowerTestChartData(dates, 80),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.xLabels.map((label) => label.label)).toEqual([
      "01.01.",
      "01.03.",
      "01.05.",
      "01.07.",
      "01.09.",
    ]);
  });

  it("strips the duplicate date suffix from labels", () => {
    const geometry = buildPowerTestGeometry({
      chartData: generateFlatPowerTestChartData(
        ["2024-07-06", "2024-07-06-1"],
        80,
      ),
      yAxisMax: 120,
      plot,
    });

    expect(geometry.xLabels.map((label) => label.label)).toEqual([
      "06.07.",
      "06.07.",
    ]);
  });
});

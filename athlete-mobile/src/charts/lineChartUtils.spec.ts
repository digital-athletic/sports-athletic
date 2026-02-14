import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import {
  calculateLabelStep,
  calculateSpacing,
  calculateYAxisMax,
  shouldShowLabel,
  transformToLineData,
} from "./lineChartUtils";

describe("lineChartUtils", () => {
  describe("transformToLineData", () => {
    it("transforms empty chart data to empty arrays", () => {
      const chartData: PowerTestChartData = {
        dates: [],
        kneeDominant: [],
        rowing: [],
        benchPress: [],
        shoulderPress: [],
      };

      const result = transformToLineData(chartData);

      expect(result).toEqual({
        squad: [],
        benchPress: [],
        rowing: [],
        shoulderPress: [],
      });
    });

    it("transforms single data point with inline label shown", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-07-06"],
        kneeDominant: [80],
        rowing: [50],
        benchPress: [60],
        shoulderPress: [35],
      };

      const result = transformToLineData(chartData);

      expect(result.squad).toEqual([
        { value: 80, label: "06.07.", showXAxisIndex: false },
      ]);
      expect(result.benchPress).toEqual([{ value: 60 }]);
      expect(result.rowing).toEqual([{ value: 50 }]);
      expect(result.shoulderPress).toEqual([{ value: 35 }]);
    });

    it("transforms multiple data points with inline labels", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-06-30", "2024-07-06", "2024-09-04"],
        kneeDominant: [0, 80, 85],
        rowing: [0, 50, 55],
        benchPress: [0, 60, 65],
        shoulderPress: [0, 35, 40],
      };

      const result = transformToLineData(chartData);

      expect(result.squad).toEqual([
        { value: 0, label: "30.06.", showXAxisIndex: false },
        { value: 80, label: "06.07.", showXAxisIndex: false },
        { value: 85, label: "04.09.", showXAxisIndex: false },
      ]);
    });

    it("handles duplicate dates with inline labels (suffix stripped)", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-07-06", "2024-07-06-1"],
        kneeDominant: [80, 85],
        rowing: [50, 55],
        benchPress: [60, 65],
        shoulderPress: [35, 40],
      };

      const result = transformToLineData(chartData);

      // Both dates display without suffix to keep labels clean
      expect(result.squad[0].label).toBe("06.07.");
      expect(result.squad[1].label).toBe("06.07.");
    });

    it("shows labels at calculated step intervals for large data sets", () => {
      const chartData: PowerTestChartData = {
        dates: Array.from({ length: 9 }, (_, i) => `2024-0${i + 1}-01`),
        kneeDominant: Array.from({ length: 9 }, () => 80),
        rowing: Array.from({ length: 9 }, () => 50),
        benchPress: Array.from({ length: 9 }, () => 60),
        shoulderPress: Array.from({ length: 9 }, () => 35),
      };

      const result = transformToLineData(chartData);

      // With 9 points and maxVisibleLabels=6, step=2
      // Shows indices 0, 2, 4, 6, 8 (every even index)
      // Label visibility is controlled by the label property (defined vs undefined)
      expect(result.squad[0].label).toBeDefined();
      expect(result.squad[1].label).toBeUndefined();
      expect(result.squad[2].label).toBeDefined();
      expect(result.squad[3].label).toBeUndefined();
      expect(result.squad[4].label).toBeDefined();
      expect(result.squad[6].label).toBeDefined();
      expect(result.squad[8].label).toBeDefined();
    });

    it("secondary series have values only without labels", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-07-06"],
        kneeDominant: [80],
        rowing: [50],
        benchPress: [60],
        shoulderPress: [35],
      };

      const result = transformToLineData(chartData);

      expect(result.benchPress[0]).not.toHaveProperty("label");
      expect(result.rowing[0]).not.toHaveProperty("label");
      expect(result.shoulderPress[0]).not.toHaveProperty("label");
    });
  });

  describe("calculateYAxisMax", () => {
    it("returns default max (120) for empty data", () => {
      const chartData: PowerTestChartData = {
        dates: [],
        kneeDominant: [],
        rowing: [],
        benchPress: [],
        shoulderPress: [],
      };

      expect(calculateYAxisMax(chartData)).toBe(120);
    });

    it("returns default max (120) when all values are zero", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-07-06"],
        kneeDominant: [0],
        rowing: [0],
        benchPress: [0],
        shoulderPress: [0],
      };

      expect(calculateYAxisMax(chartData)).toBe(120);
    });

    it("rounds up to nearest 20 with padding for values under 120", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-07-06"],
        kneeDominant: [100],
        rowing: [50],
        benchPress: [60],
        shoulderPress: [35],
      };

      // Max is 100, with 1.1x padding = 110, rounded up to 120
      expect(calculateYAxisMax(chartData)).toBe(120);
    });

    it("expands beyond default max for high values", () => {
      const chartData: PowerTestChartData = {
        dates: ["2024-07-06"],
        kneeDominant: [150],
        rowing: [50],
        benchPress: [60],
        shoulderPress: [35],
      };

      // Max is 150, with 1.1x padding = 165, rounded up to 180
      expect(calculateYAxisMax(chartData)).toBe(180);
    });
  });

  describe("calculateLabelStep", () => {
    it("returns 1 when points <= maxVisibleLabels (6)", () => {
      expect(calculateLabelStep(4)).toBe(1);
      expect(calculateLabelStep(6)).toBe(1);
    });

    it("returns step of 2 for 7-12 points", () => {
      expect(calculateLabelStep(7)).toBe(2);
      expect(calculateLabelStep(12)).toBe(2);
    });

    it("returns step of 3 for 13-18 points", () => {
      expect(calculateLabelStep(13)).toBe(3);
      expect(calculateLabelStep(18)).toBe(3);
    });

    it("scales step for large data sets", () => {
      // 20 points / 6 maxVisible = 3.33, ceil = 4
      expect(calculateLabelStep(20)).toBe(4);
    });
  });

  describe("shouldShowLabel", () => {
    it("shows first label when step is any value", () => {
      expect(shouldShowLabel(0, 10, 2)).toBe(true);
      expect(shouldShowLabel(0, 10, 3)).toBe(true);
    });

    it("shows labels at step positions", () => {
      expect(shouldShowLabel(2, 10, 2)).toBe(true);
      expect(shouldShowLabel(4, 10, 2)).toBe(true);
      expect(shouldShowLabel(6, 10, 2)).toBe(true);
      expect(shouldShowLabel(8, 10, 2)).toBe(true);
    });

    it("hides labels not at step positions", () => {
      expect(shouldShowLabel(1, 10, 2)).toBe(false);
      expect(shouldShowLabel(3, 10, 2)).toBe(false);
      expect(shouldShowLabel(9, 10, 2)).toBe(false);
    });
  });

  describe("calculateSpacing", () => {
    const chartWidth = 300;
    const initialSpacing = 5;
    const endSpacing = 35;

    it("returns full width minus spacing for single data point", () => {
      const result = calculateSpacing(
        1,
        chartWidth,
        initialSpacing,
        endSpacing,
      );
      expect(result).toBe(chartWidth - initialSpacing - endSpacing);
    });

    it("calculates spacing to fill width for 2 data points", () => {
      const result = calculateSpacing(
        2,
        chartWidth,
        initialSpacing,
        endSpacing,
      );
      // (300 - 5 - 35) / 1 = 260
      expect(result).toBe(260);
    });

    it("calculates spacing to fill width for 4 data points", () => {
      const result = calculateSpacing(
        4,
        chartWidth,
        initialSpacing,
        endSpacing,
      );
      // (300 - 5 - 35) / 3 = 86.67
      expect(result).toBeCloseTo(86.67, 1);
    });

    it("calculates spacing to fill width for 9 data points", () => {
      const result = calculateSpacing(
        9,
        chartWidth,
        initialSpacing,
        endSpacing,
      );
      // (300 - 5 - 35) / 8 = 32.5
      expect(result).toBeCloseTo(32.5);
    });

    it("handles zero data points by returning full width minus spacing", () => {
      const result = calculateSpacing(
        0,
        chartWidth,
        initialSpacing,
        endSpacing,
      );
      expect(result).toBe(chartWidth - initialSpacing - endSpacing);
    });

    it("defaults endSpacing to 0 when not provided", () => {
      const result = calculateSpacing(4, chartWidth, initialSpacing);
      // (300 - 5 - 0) / 3 = 98.33...
      expect(result).toBeCloseTo(98.33, 1);
    });
  });
});

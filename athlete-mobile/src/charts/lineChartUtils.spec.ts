import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import {
  calculateLabelStep,
  calculateYAxisMax,
  shouldShowLabel,
} from "./lineChartUtils";

describe("lineChartUtils", () => {
  describe("calculateYAxisMax", () => {
    it("returns default max (120) for empty data", () => {
      const chartData: PowerTestChartData = {
        dates: [],
        kneeDominant: [],
        deadlift: [],
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
        deadlift: [0],
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
        deadlift: [90],
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
        deadlift: [130],
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
});

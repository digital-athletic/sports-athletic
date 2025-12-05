import {
  calculateHeartRateIntervalForExercise,
  calculateHeartRateZone,
  calculateMaxHeartRate,
} from "./heartRateUtils";

describe("heartRateUtils", () => {
  describe("calculateMaxHeartRate", () => {
    it("should calculate max heart rate using 220 - age formula", () => {
      expect(calculateMaxHeartRate(30)).toBe(190);
      expect(calculateMaxHeartRate(40)).toBe(180);
      expect(calculateMaxHeartRate(50)).toBe(170);
    });
  });

  describe("calculateHeartRateZone", () => {
    it("should calculate EASY zone (50-70%)", () => {
      const zone = calculateHeartRateZone(30, "EASY");
      expect(zone.low).toBeGreaterThanOrEqual(127); // ~50% of HRR
      expect(zone.high).toBeLessThanOrEqual(153); // ~70% of HRR
    });

    it("should calculate MODERATE zone (70-85%)", () => {
      const zone = calculateHeartRateZone(30, "MODERATE");
      expect(zone.low).toBeGreaterThanOrEqual(153); // ~70% of HRR
      expect(zone.high).toBeLessThanOrEqual(171); // ~85% of HRR
    });

    it("should calculate HARD zone (85-95%)", () => {
      const zone = calculateHeartRateZone(30, "HARD");
      expect(zone.low).toBeGreaterThanOrEqual(171); // ~85% of HRR
      expect(zone.high).toBeLessThanOrEqual(186); // ~95% of HRR
    });
  });

  describe("calculateHeartRateIntervalForExercise", () => {
    it("should return EASY zone for WARMUP skill", () => {
      const interval = calculateHeartRateIntervalForExercise(30, "WARMUP");
      expect(interval.low).toBeLessThan(interval.high);
    });

    it("should return MODERATE zone for CARDIO skill", () => {
      const interval = calculateHeartRateIntervalForExercise(30, "CARDIO");
      expect(interval.low).toBeLessThan(interval.high);
    });

    it("should return HARD zone for SWR skill", () => {
      const interval = calculateHeartRateIntervalForExercise(30, "SWR");
      expect(interval.low).toBeLessThan(interval.high);
    });
  });
});

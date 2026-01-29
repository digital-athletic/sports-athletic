import {
  calculateHeartRateIntervalForExercise,
  calculateHeartRateZone,
  calculateMaxHeartRate,
  heartRateBySkillAndBirthday,
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

  describe("heartRateBySkillAndBirthday", () => {
    const currentYear = new Date().getFullYear();
    // Age group thresholds: CHILD (≤16), ADOLESCENT (17-18), ADULT (≥19) as defined in WorkoutConstants.AGE_GROUPS_MAX_AGE
    // ISO 8601 format: YYYY-MM-DD
    // Using January 1st to ensure birthday has passed and age calculation is predictable
    const childBirthday = `${currentYear - 10}-01-01`; // age 10
    const adolescentBirthday = `${currentYear - 17}-01-01`; // age 17
    const adultBirthday = `${currentYear - 30}-01-01`; // age 30
    const seniorBirthday = `${currentYear - 60}-01-01`; // age 60

    it("should return undefined for invalid birthday format", () => {
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", "invalid"),
      ).toBeUndefined();
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", "15-06"),
      ).toBeUndefined();
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", "15-06-abcde"),
      ).toBeUndefined();
    });

    it("should calculate CARDIO_1_LAKTAT zone (80-95%) for age group CHILD", () => {
      const interval = heartRateBySkillAndBirthday(
        "CARDIO_1_LAKTAT",
        childBirthday,
      );
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toBeLessThan(interval!.high);
    });

    it("should calculate CARDIO_1_LAKTAT zone (80-95%) for age group ADOLESCENT", () => {
      const interval = heartRateBySkillAndBirthday(
        "CARDIO_1_LAKTAT",
        adolescentBirthday,
      );
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toBeLessThan(interval!.high);
    });

    it("should calculate CARDIO_1_LAKTAT zone (80-95%) for ADULT age group", () => {
      const interval = heartRateBySkillAndBirthday(
        "CARDIO_1_LAKTAT",
        adultBirthday,
      );
      expect(interval).toBeDefined();
      expect(interval?.low).toBeLessThan(interval?.high || 0);
      expect(interval?.low).toBe(Math.round(0.8 * (210 - 30)));
      expect(interval?.high).toBe(Math.round(0.95 * (210 - 30)));
    });

    it("should calculate CARDIO_3 zone (80-95%)", () => {
      const interval = heartRateBySkillAndBirthday("CARDIO_3", adultBirthday);
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toBeLessThan(interval!.high);
    });

    it("should calculate CARDIO_2 zone (90-100%)", () => {
      const interval = heartRateBySkillAndBirthday("CARDIO_2", adultBirthday);
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toBeLessThan(interval!.high);
    });

    it("should calculate CARDIO_4 zone (65-80%)", () => {
      const interval = heartRateBySkillAndBirthday("CARDIO_4", adultBirthday);
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toBeLessThan(interval!.high);
    });

    it("should calculate CARDIO_5 zone (55-65%)", () => {
      const interval = heartRateBySkillAndBirthday("CARDIO_5", adultBirthday);
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toBeLessThan(interval!.high);
    });

    it("should handle CARDIO_1_SHORT (default case: 100-100%)", () => {
      const interval = heartRateBySkillAndBirthday(
        "CARDIO_1_SHORT",
        adultBirthday,
      );
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toEqual(interval!.high);
    });

    it("should handle unknown skill as default case: 100-100%", () => {
      const interval = heartRateBySkillAndBirthday(
        "UNKNOWN_SKILL",
        adultBirthday,
      );
      expect(interval).toBeDefined();
      expect(interval?.low).toBeDefined();
      expect(interval?.high).toBeDefined();
      expect(interval!.low).toEqual(interval!.high);
    });

    it("should correctly calculate heart rate for different age groups", () => {
      const childInterval = heartRateBySkillAndBirthday(
        "CARDIO_1_LAKTAT",
        childBirthday,
      );
      const adultInterval = heartRateBySkillAndBirthday(
        "CARDIO_1_LAKTAT",
        adultBirthday,
      );
      const seniorInterval = heartRateBySkillAndBirthday(
        "CARDIO_1_LAKTAT",
        seniorBirthday,
      );

      // Older ages should have lower max frequency
      expect(childInterval?.low).toBeGreaterThan(adultInterval?.low || 0);
      expect(adultInterval?.low).toBeGreaterThan(seniorInterval?.low || 0);
    });
  });
});

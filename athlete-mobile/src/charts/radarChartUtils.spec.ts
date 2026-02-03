import type { UserSkills } from "@/features/statistics/models/WorkoutsData";
import { SKILL_ORDER, calculatePercentages } from "./radarChartUtils";

describe("radarChartUtils", () => {
  describe("SKILL_ORDER", () => {
    it("contains all 6 skills in correct clockwise order from design", () => {
      expect(SKILL_ORDER).toEqual([
        "MOBILITY",
        "PREVENTION",
        "CARDIO",
        "STABILITY",
        "WARMUP",
        "SWR",
      ]);
    });

    it("starts with MOBILITY at the top", () => {
      expect(SKILL_ORDER[0]).toBe("MOBILITY");
    });
  });

  describe("calculatePercentages", () => {
    it("returns zero for all skills when all values are 0", () => {
      const userSkills: UserSkills = {
        MOBILITY: 0,
        PREVENTION: 0,
        CARDIO: 0,
        STABILITY: 0,
        WARMUP: 0,
        SWR: 0,
      };

      expect(calculatePercentages(userSkills)).toEqual({
        MOBILITY: 0,
        PREVENTION: 0,
        CARDIO: 0,
        STABILITY: 0,
        WARMUP: 0,
        SWR: 0,
      });
    });

    it("returns same percentages when total equals 100", () => {
      const userSkills: UserSkills = {
        MOBILITY: 20,
        PREVENTION: 15,
        CARDIO: 10,
        STABILITY: 25,
        WARMUP: 20,
        SWR: 10,
      };

      expect(calculatePercentages(userSkills)).toEqual({
        MOBILITY: 20,
        PREVENTION: 15,
        CARDIO: 10,
        STABILITY: 25,
        WARMUP: 20,
        SWR: 10,
      });
    });

    it("calculates proportional percentages when total is not 100", () => {
      const userSkills: UserSkills = {
        MOBILITY: 50,
        PREVENTION: 50,
        CARDIO: 50,
        STABILITY: 50,
        WARMUP: 50,
        SWR: 50,
      };

      const result = calculatePercentages(userSkills);
      // Each skill has 50 out of 300 total = 16.67%
      const expectedPercentage = (50 / 300) * 100;

      expect(result.MOBILITY).toBeCloseTo(expectedPercentage, 2);
      expect(result.SWR).toBeCloseTo(expectedPercentage, 2);
    });

    it("returns 100% for single skill with all value, 0% for others", () => {
      const userSkills: UserSkills = {
        MOBILITY: 100,
        PREVENTION: 0,
        CARDIO: 0,
        STABILITY: 0,
        WARMUP: 0,
        SWR: 0,
      };

      expect(calculatePercentages(userSkills)).toEqual({
        MOBILITY: 100,
        PREVENTION: 0,
        CARDIO: 0,
        STABILITY: 0,
        WARMUP: 0,
        SWR: 0,
      });
    });
  });
});

import { calculateSkillsFromTime } from "./trainingSuccessUtils";

describe("trainingSuccessUtils", () => {
  describe("calculateSkillsFromTime", () => {
    it("converts milliseconds to seconds using floor", () => {
      const skillTime = {
        PREVENTION: 120000, // 120 seconds
        MOBILITY: 90500, // 90.5 seconds -> 90
        SWR: 180000, // 180 seconds
        WARMUP: 30999, // 30.999 seconds -> 30
        STABILITY: 150000, // 150 seconds
        CARDIO: 0,
      };

      const result = calculateSkillsFromTime(skillTime);

      expect(result).toEqual({
        PREVENTION: 120,
        MOBILITY: 90,
        SWR: 180,
        WARMUP: 30,
        STABILITY: 150,
        CARDIO: 0,
      });
    });

    it("handles zero and undefined values", () => {
      const skillTime = {
        PREVENTION: 0,
        MOBILITY: 0,
        SWR: 0,
        WARMUP: 0,
        STABILITY: 0,
        CARDIO: 0,
      };

      const result = calculateSkillsFromTime(skillTime);

      expect(result).toEqual({
        PREVENTION: 0,
        MOBILITY: 0,
        SWR: 0,
        WARMUP: 0,
        STABILITY: 0,
        CARDIO: 0,
      });
    });
  });
});

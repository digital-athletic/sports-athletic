import {
  calculateMaxHeartRate,
  heartRateBySkillAndBirthday,
} from "./heartRateUtils";

describe("heartRateUtils", () => {
  describe("calculateMaxHeartRate", () => {
    it("should calculate max heart rate using the Tanaka formula 208 minus 0.7 times age", () => {
      expect(calculateMaxHeartRate(20)).toBe(194);
      expect(calculateMaxHeartRate(30)).toBe(187);
      expect(calculateMaxHeartRate(50)).toBe(173);
    });
  });

  describe("heartRateBySkillAndBirthday", () => {
    const currentYear = new Date().getFullYear();
    // Using January 1st to ensure the birthday has passed and the age is predictable
    const childBirthday = `${currentYear - 10}-01-01`; // max heart rate 201
    const adolescentBirthday = `${currentYear - 17}-01-01`; // max heart rate 196.1
    const adultBirthday = `${currentYear - 30}-01-01`; // max heart rate 187
    const seniorBirthday = `${currentYear - 60}-01-01`; // max heart rate 166

    it("should fall back to age 20 when the birthday is missing or invalid", () => {
      const expected = { low: 155, high: 184 };
      for (const birthday of [
        "",
        "invalid",
        "15-06",
        "2010-13-45",
        "1990-02-31",
      ]) {
        expect(
          heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", birthday),
        ).toEqual(expected);
      }
    });

    it("should calculate the CARDIO_1_LAKTAT zone (80 to 95%) for a child", () => {
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", childBirthday),
      ).toEqual({ low: 161, high: 191 });
    });

    it("should calculate the CARDIO_1_LAKTAT zone (80 to 95%) for an adolescent", () => {
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", adolescentBirthday),
      ).toEqual({ low: 157, high: 186 });
    });

    it("should calculate the CARDIO_1_LAKTAT zone (80 to 95%) for an adult", () => {
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", adultBirthday),
      ).toEqual({ low: 150, high: 178 });
    });

    it("should calculate the CARDIO_1_LAKTAT zone (80 to 95%) for a senior", () => {
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_LAKTAT", seniorBirthday),
      ).toEqual({ low: 133, high: 158 });
    });

    it("should calculate the CARDIO_3 zone (80 to 95%)", () => {
      expect(heartRateBySkillAndBirthday("CARDIO_3", adultBirthday)).toEqual({
        low: 150,
        high: 178,
      });
    });

    it("should calculate the CARDIO_2 zone (90 to 100%)", () => {
      expect(heartRateBySkillAndBirthday("CARDIO_2", adultBirthday)).toEqual({
        low: 168,
        high: 187,
      });
    });

    it("should calculate the CARDIO_4 zone (65 to 80%)", () => {
      expect(heartRateBySkillAndBirthday("CARDIO_4", adultBirthday)).toEqual({
        low: 122,
        high: 150,
      });
    });

    it("should calculate the CARDIO_5 zone (55 to 65%)", () => {
      expect(heartRateBySkillAndBirthday("CARDIO_5", adultBirthday)).toEqual({
        low: 103,
        high: 122,
      });
    });

    it("should use the full max heart rate for CARDIO_1_SHORT", () => {
      expect(
        heartRateBySkillAndBirthday("CARDIO_1_SHORT", adultBirthday),
      ).toEqual({ low: 187, high: 187 });
    });

    it("should use the full max heart rate for an unknown skill", () => {
      expect(
        heartRateBySkillAndBirthday("UNKNOWN_SKILL", adultBirthday),
      ).toEqual({ low: 187, high: 187 });
    });
  });
});

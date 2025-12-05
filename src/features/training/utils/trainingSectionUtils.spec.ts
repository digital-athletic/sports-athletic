import { type SectionTypes } from "@/constants/workoutConstants";
import { getIntensityForSection } from "./trainingSectionUtils";

describe("trainingSectionUtils", () => {
  describe("getIntensityForSection", () => {
    it("should return 6 for SWR1 section type", () => {
      const result = getIntensityForSection("SWR1");
      expect(result).toBe(6);
    });

    it("should return 6 for SWR1KG section type", () => {
      const result = getIntensityForSection("SWR1KG");
      expect(result).toBe(6);
    });

    it("should return 7 for SWR2 section type", () => {
      const result = getIntensityForSection("SWR2");
      expect(result).toBe(7);
    });

    it("should return 7 for SWR2KG section type", () => {
      const result = getIntensityForSection("SWR2KG");
      expect(result).toBe(7);
    });

    it("should return 8 for SA section type", () => {
      const result = getIntensityForSection("SA");
      expect(result).toBe(8);
    });

    it("should return 8 for SAKG section type", () => {
      const result = getIntensityForSection("SAKG");
      expect(result).toBe(8);
    });

    it("should return 9 for SK section type", () => {
      const result = getIntensityForSection("SK");
      expect(result).toBe(9);
    });

    it("should return 9 for SKKG section type", () => {
      const result = getIntensityForSection("SKKG");
      expect(result).toBe(9);
    });

    it("should return 10 for MAX section type", () => {
      const result = getIntensityForSection("MAX");
      expect(result).toBe(10);
    });

    it("should return 10 for MAX_KRAFT section type", () => {
      const result = getIntensityForSection("MAX_KRAFT");
      expect(result).toBe(10);
    });

    it("should return 10 for unknown section type (default case)", () => {
      const result = getIntensityForSection("UNKNOWN" as SectionTypes);
      expect(result).toBe(10);
    });

    it("should handle all valid SectionTypes", () => {
      const validTypes: SectionTypes[] = [
        "SWR1",
        "SWR1KG",
        "SWR2",
        "SWR2KG",
        "MAX",
        "MAX_KRAFT",
        "SK",
        "SKKG",
        "SAKG",
        "SA",
      ];

      validTypes.forEach((type) => {
        const result = getIntensityForSection(type);
        expect(result).toBeGreaterThanOrEqual(6);
        expect(result).toBeLessThanOrEqual(10);
      });
    });
  });
});

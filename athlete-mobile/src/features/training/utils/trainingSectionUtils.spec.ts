import { type SectionTypes } from "@/constants/workoutConstants";
import { TrainingSectionType } from "../models/TrainingSection";
import {
  extendSectionsForMissedWeeks,
  getIntensityForSection,
} from "./trainingSectionUtils";

// Factory function for creating test sections
const createSection = (
  start: string,
  type: TrainingSectionType["type"] = "SWR1",
  numOfWeeks = 4,
): TrainingSectionType => ({
  start,
  type,
  numOfWeeks,
  cardioType: "CARDIO_2",
  trainings: [],
});

describe("trainingSectionUtils", () => {
  describe("extendSectionsForMissedWeeks", () => {
    const baseSections: TrainingSectionType[] = [
      createSection("2025-01-06", "SWR1", 4),
      createSection("2025-02-03", "SWR2", 4),
    ];

    describe("when daysSinceLastWorkout <= 7", () => {
      it("returns sections unchanged with additionalWeeks = 0 for exactly 7 days", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 7);

        expect(result.additionalWeeks).toBe(0);
        expect(result.sections[0].start).toBe("2025-01-06");
        expect(result.sections[1].start).toBe("2025-02-03");
      });

      it("returns sections unchanged for fewer than 7 days", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 3);

        expect(result.additionalWeeks).toBe(0);
        expect(result.sections[0].start).toBe("2025-01-06");
      });

      it("returns a new array (not the same reference)", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 7);

        expect(result.sections).not.toBe(baseSections);
      });
    });

    describe("when daysSinceLastWorkout > 7", () => {
      it("extends section start dates by complete weeks (14 days = 2 weeks)", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 14);

        expect(result.additionalWeeks).toBe(2);
        expect(result.sections[0].start).toBe("2025-01-20"); // +14 days
        expect(result.sections[1].start).toBe("2025-02-17"); // +14 days
      });

      it("extends section start dates for 21 days (3 weeks)", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 21);

        expect(result.additionalWeeks).toBe(3);
        expect(result.sections[0].start).toBe("2025-01-27"); // +21 days
        expect(result.sections[1].start).toBe("2025-02-24"); // +21 days
      });

      it("maintains ISO 8601 date format (YYYY-MM-DD)", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 14);

        for (const section of result.sections) {
          expect(section.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(section.start).not.toContain("T");
        }
      });

      it("clips last section numOfWeeks by additional weeks", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 14);

        expect(result.sections[0].numOfWeeks).toBe(4); // Unchanged (not last)
        expect(result.sections[1].numOfWeeks).toBe(2); // 4 - 2 = 2
      });

      it("does not allow negative numOfWeeks", () => {
        const sections = [createSection("2025-01-06", "SWR1", 2)];
        const result = extendSectionsForMissedWeeks(sections, 28); // 4 weeks

        expect(result.sections[0].numOfWeeks).toBe(0); // max(0, 2-4)
      });

      it("does not mutate original sections", () => {
        const original = JSON.parse(JSON.stringify(baseSections));
        extendSectionsForMissedWeeks(baseSections, 14);

        expect(baseSections).toEqual(original);
      });

      it("preserves other section properties", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 14);

        expect(result.sections[0].type).toBe("SWR1");
        expect(result.sections[0].cardioType).toBe("CARDIO_2");
        expect(result.sections[1].type).toBe("SWR2");
      });
    });

    describe("edge cases", () => {
      it("handles single section", () => {
        const singleSection = [createSection("2025-01-06", "SWR1", 4)];
        const result = extendSectionsForMissedWeeks(singleSection, 14);

        expect(result.sections).toHaveLength(1);
        expect(result.sections[0].start).toBe("2025-01-20");
        expect(result.sections[0].numOfWeeks).toBe(2); // Clipped as it's the last
      });

      it("handles empty sections array", () => {
        const result = extendSectionsForMissedWeeks([], 14);

        expect(result.sections).toEqual([]);
        expect(result.additionalWeeks).toBe(2);
      });

      it("handles exactly 8 days (1 full week)", () => {
        const result = extendSectionsForMissedWeeks(baseSections, 8);

        expect(result.additionalWeeks).toBe(1);
        expect(result.sections[0].start).toBe("2025-01-13"); // +7 days
      });
    });
  });

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

    it("should return 10 for MAX_STRENGTH section type", () => {
      const result = getIntensityForSection("MAX_STRENGTH");
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
        "MAX_STRENGTH",
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

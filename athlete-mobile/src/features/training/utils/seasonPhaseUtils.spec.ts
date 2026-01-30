import {
  calculateNumOfWeeks,
  calculateNumOfWeeksFromDate,
  enrichSeasonPhaseWithWeeks,
  enrichSeasonPhaseWithWeeksFromDate,
} from "./seasonPhaseUtils";
import { formatDateToISO } from "@/utils/date";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";

describe("seasonPhaseUtils", () => {
  describe("calculateNumOfWeeks", () => {
    it("should calculate weeks from now to end date", () => {
      // Use 22 days to ensure we get at least 3 full weeks (accounting for floor rounding)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 22);
      const endDate = formatDateToISO(futureDate);

      const result = calculateNumOfWeeks(endDate);

      expect(result).toBeGreaterThanOrEqual(3);
    });

    it("should return minimum 1 week for past dates", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const endDate = formatDateToISO(pastDate);

      const result = calculateNumOfWeeks(endDate);

      expect(result).toBe(1);
    });
  });

  describe("calculateNumOfWeeksFromDate", () => {
    it("should calculate weeks from start date to end date", () => {
      const startDate = new Date("2025-01-01");
      const endDate = "2025-01-22"; // 3 weeks later (ISO 8601 format)

      const result = calculateNumOfWeeksFromDate(endDate, startDate);

      expect(result).toBe(3);
    });
  });

  describe("enrichSeasonPhaseWithWeeks", () => {
    it("should add numOfWeeks to season phase", () => {
      // Use 15 days to ensure we get at least 2 full weeks (accounting for floor rounding)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const phase = {
        type: SeasonPhase.COMPETITION,
        endDate: formatDateToISO(futureDate),
      };

      const result = enrichSeasonPhaseWithWeeks(phase);

      expect(result.numOfWeeks).toBeGreaterThanOrEqual(2);
      expect(result.type).toBe(SeasonPhase.COMPETITION);
    });
  });

  describe("enrichSeasonPhaseWithWeeksFromDate", () => {
    it("should add numOfWeeks calculated from start date", () => {
      const startDate = new Date("2025-01-01");
      const phase = {
        type: SeasonPhase.PREPARATORY,
        endDate: "2025-01-29", // 4 weeks later (ISO 8601 format)
      };

      const result = enrichSeasonPhaseWithWeeksFromDate(phase, startDate);

      expect(result.numOfWeeks).toBe(4);
      expect(result.type).toBe(SeasonPhase.PREPARATORY);
    });
  });
});

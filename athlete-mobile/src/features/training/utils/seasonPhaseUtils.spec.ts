import {
  calculateNumOfWeeks,
  calculateNumOfWeeksFromDate,
  enrichSeasonPhaseWithWeeks,
  enrichSeasonPhaseWithWeeksFromDate,
} from "./seasonPhaseUtils";
import { dateToDDMMYYYY } from "@/utils/date";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";

describe("seasonPhaseUtils", () => {
  describe("calculateNumOfWeeks", () => {
    it("should calculate weeks from now to end date", () => {
      // Use 22 days to ensure we get at least 3 full weeks (accounting for floor rounding)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 22);
      const endDate = dateToDDMMYYYY(futureDate);

      const result = calculateNumOfWeeks(endDate);

      expect(result).toBeGreaterThanOrEqual(3);
    });

    it("should return minimum 1 week for past dates", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const endDate = dateToDDMMYYYY(pastDate);

      const result = calculateNumOfWeeks(endDate);

      expect(result).toBe(1);
    });
  });

  describe("calculateNumOfWeeksFromDate", () => {
    it("should calculate weeks from start date to end date", () => {
      const startDate = new Date("2025-01-01");
      const endDate = "22-01-2025"; // 3 weeks later

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
        endDate: dateToDDMMYYYY(futureDate),
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
        endDate: "29-01-2025", // 4 weeks later
      };

      const result = enrichSeasonPhaseWithWeeksFromDate(phase, startDate);

      expect(result.numOfWeeks).toBe(4);
      expect(result.type).toBe(SeasonPhase.PREPARATORY);
    });
  });
});

import { deriveSeasonPhaseEndDate, getPassedWeeksSinceDate } from "./timeUtils";

describe("timeUtils", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Set a fixed date for consistent testing: January 1, 2026
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z").getTime());
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getPassedWeeksSinceDate", () => {
    it("returns 0 when start date is today", () => {
      const result = getPassedWeeksSinceDate("01-01-2026"); // today
      expect(result).toBe(0);
    });

    it("returns 1 when start date was exactly 1 week ago", () => {
      const result = getPassedWeeksSinceDate("25-12-2025"); // one week ago
      expect(result).toBe(1);
    });

    it("returns 4 when start date was 4 weeks ago", () => {
      const result = getPassedWeeksSinceDate("04-12-2025"); // four weeks ago
      expect(result).toBe(4);
    });

    it("returns 0 when start date is 6 days ago (less than a week)", () => {
      const result = getPassedWeeksSinceDate("26-12-2025"); // 6 days ago
      expect(result).toBe(0);
    });

    it("returns 2 when start date was 2 weeks ago", () => {
      const result = getPassedWeeksSinceDate("18-12-2025"); // two weeks ago
      expect(result).toBe(2);
    });

    it("returns negative value when start date is in the future", () => {
      const result = getPassedWeeksSinceDate("15-01-2026"); // 2 weeks in future
      expect(result).toBe(-2);
    });
  });

  describe("deriveSeasonPhaseEndDate", () => {
    describe("without training plan section", () => {
      it("returns 12 weeks from now as default", () => {
        // 12 weeks = 12 * 7 = 84 days
        // From Jan 1, 2026 + 84 days = March 26, 2026
        expect(deriveSeasonPhaseEndDate(undefined)).toBe("26-03-2026");
        expect(deriveSeasonPhaseEndDate(null as any)).toBe("26-03-2026");
      });
    });

    describe("with training plan section", () => {
      it("returns end date based on start + numOfWeeks", () => {
        // Section starts on Jan 15, 2026 and lasts 8 weeks
        const result = deriveSeasonPhaseEndDate({
          start: "15-01-2026",
          numOfWeeks: 8,
        });

        // Start: Jan 15 + 8 weeks (56 days) = March 12, 2026
        expect(result).toBe("12-03-2026");
      });

      it("handles single weeks", () => {
        const result = deriveSeasonPhaseEndDate({
          start: "01-02-2026",
          numOfWeeks: 1,
        });

        // Start: Feb 1 + 1 week (7 days) = Feb 8, 2026
        expect(result).toBe("08-02-2026");
      });

      it("handles longer training phases (e.g., 16 weeks)", () => {
        const result = deriveSeasonPhaseEndDate({
          start: "01-01-2026",
          numOfWeeks: 16,
        });

        // Start: Jan 1 + 16 weeks (112 days) = April 23, 2026
        expect(result).toBe("23-04-2026");
      });

      it("maintains date format DD-MM-YYYY", () => {
        const result = deriveSeasonPhaseEndDate({
          start: "25-12-2025",
          numOfWeeks: 2,
        });

        // Start: Dec 25 + 2 weeks (14 days) = Jan 8, 2026
        expect(result).toBe("08-01-2026");
      });
    });
  });
});

import { getPassedWeeksSinceDate } from "./timeUtils";

describe("timeUtils", () => {
  describe("getPassedWeeksSinceDate", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return 0 when start date is today", () => {
      const today = new Date();
      jest.setSystemTime(today);

      const result = getPassedWeeksSinceDate(today.toISOString());

      expect(result).toBe(0);
    });

    it("should return 1 when start date was exactly 1 week ago", () => {
      const now = new Date("2025-12-04T12:00:00Z");
      jest.setSystemTime(now);

      const oneWeekAgo = new Date("2025-11-27T12:00:00Z");
      const result = getPassedWeeksSinceDate(oneWeekAgo.toISOString());

      expect(result).toBe(1);
    });

    it("should return 4 when start date was 4 weeks ago", () => {
      const now = new Date("2025-12-04T12:00:00Z");
      jest.setSystemTime(now);

      const fourWeeksAgo = new Date("2025-11-06T12:00:00Z");
      const result = getPassedWeeksSinceDate(fourWeeksAgo.toISOString());

      expect(result).toBe(4);
    });

    it("should return 0 when start date is 6 days ago (less than a week)", () => {
      const now = new Date("2025-12-04T12:00:00Z");
      jest.setSystemTime(now);

      const sixDaysAgo = new Date("2025-11-28T12:00:00Z");
      const result = getPassedWeeksSinceDate(sixDaysAgo.toISOString());

      expect(result).toBe(0);
    });

    it("should return 2 when start date was 2 weeks ago", () => {
      const now = new Date("2025-12-04T12:00:00Z");
      jest.setSystemTime(now);

      const twoWeeksAgo = new Date("2025-11-20T12:00:00Z");
      const result = getPassedWeeksSinceDate(twoWeeksAgo.toISOString());

      expect(result).toBe(2);
    });

    it("should return negative value when start date is in the future", () => {
      const now = new Date("2025-12-04T12:00:00Z");
      jest.setSystemTime(now);

      const futureDate = new Date("2025-12-18T12:00:00Z");
      const result = getPassedWeeksSinceDate(futureDate.toISOString());

      expect(result).toBe(-2);
    });
  });
});

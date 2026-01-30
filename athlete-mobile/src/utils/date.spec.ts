import {
  formatDateToISO,
  ISODateToDate,
  isISODate,
  formatDateForDisplay,
  addDays,
  calculateAgeFromBirthday,
  dateToHHMM,
  HHMMToDate,
} from "./date";

describe("date utils", () => {
  describe("isISODate", () => {
    it("returns true for valid ISO date strings", () => {
      expect(isISODate("2024-01-15")).toBe(true);
      expect(isISODate("2024-12-31")).toBe(true);
      expect(isISODate("1990-06-05")).toBe(true);
    });

    it("returns false for invalid formats", () => {
      expect(isISODate("15-01-2024")).toBe(false);
      expect(isISODate("2024/01/15")).toBe(false);
      expect(isISODate("2024-1-15")).toBe(false);
      expect(isISODate("24-01-15")).toBe(false);
      expect(isISODate("invalid")).toBe(false);
      expect(isISODate("")).toBe(false);
    });
  });

  describe("formatDateToISO", () => {
    it("formats date to ISO string", () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      expect(formatDateToISO(date)).toBe("2024-06-15");
    });

    it("pads single digit month and day", () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDateToISO(date)).toBe("2024-01-05");
    });

    it("handles year boundaries", () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      expect(formatDateToISO(date)).toBe("2024-12-31");
    });
  });

  describe("ISODateToDate", () => {
    it("parses ISO string to Date at local midnight", () => {
      const date = ISODateToDate("2024-06-15");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5); // June (0-indexed)
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it("handles year boundaries", () => {
      const date = ISODateToDate("2024-12-31");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });

    it("throws for non-ISO format", () => {
      expect(() => ISODateToDate("15-06-2024")).toThrow("Expected ISO 8601");
      expect(() => ISODateToDate("invalid")).toThrow("Expected ISO 8601");
      expect(() => ISODateToDate("")).toThrow("Expected ISO 8601");
    });
  });

  describe("round-trip conversion", () => {
    it("ISO string -> Date -> ISO string preserves value", () => {
      const original = "2024-01-15";
      const date = ISODateToDate(original);
      const result = formatDateToISO(date);
      expect(result).toBe(original);
    });

    it("Date -> ISO string -> Date preserves components", () => {
      const original = new Date(2024, 0, 15);
      const isoString = formatDateToISO(original);
      const result = ISODateToDate(isoString);
      expect(result.getFullYear()).toBe(original.getFullYear());
      expect(result.getMonth()).toBe(original.getMonth());
      expect(result.getDate()).toBe(original.getDate());
    });

    it("handles edge dates correctly", () => {
      const dates = ["2024-02-29", "2024-01-01", "2024-12-31", "2000-06-15"];
      for (const iso of dates) {
        const date = ISODateToDate(iso);
        expect(formatDateToISO(date)).toBe(iso);
      }
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats Date to DD.MM.YYYY", () => {
      const date = new Date(2024, 5, 15);
      expect(formatDateForDisplay(date)).toBe("15.06.2024");
    });

    it("formats ISO string to DD.MM.YYYY", () => {
      expect(formatDateForDisplay("2024-06-15")).toBe("15.06.2024");
    });

    it("pads single digit day and month", () => {
      expect(formatDateForDisplay("2024-01-05")).toBe("05.01.2024");
    });

    it("throws for invalid Date", () => {
      expect(() => formatDateForDisplay(new Date("invalid"))).toThrow();
    });
  });

  describe("addDays", () => {
    it("adds days within same month", () => {
      const date = new Date(2025, 0, 15);
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(0);
    });

    it("adds days crossing into next month", () => {
      const date = new Date(2025, 0, 25);
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
    });

    it("adds days crossing into next year", () => {
      const date = new Date(2025, 11, 28);
      const result = addDays(date, 10);
      expect(result.getDate()).toBe(7);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2026);
    });

    it("handles negative days", () => {
      const date = new Date(2025, 0, 15);
      const result = addDays(date, -10);
      expect(result.getDate()).toBe(5);
    });

    it("does not mutate the original date", () => {
      const original = new Date(2025, 0, 15);
      const originalTime = original.getTime();
      addDays(original, 10);
      expect(original.getTime()).toBe(originalTime);
    });
  });

  describe("calculateAgeFromBirthday", () => {
    it("calculates age for birthday earlier this year", () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 25}-01-01`;
      expect(calculateAgeFromBirthday(birthday)).toBe(25);
    });

    it("calculates age for birthday later this year", () => {
      const currentYear = new Date().getFullYear();
      const birthday = `${currentYear - 25}-12-31`;
      expect(calculateAgeFromBirthday(birthday)).toBe(24);
    });

    it("handles birthday today", () => {
      const today = new Date();
      const year = today.getFullYear() - 30;
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      expect(calculateAgeFromBirthday(`${year}-${month}-${day}`)).toBe(30);
    });

    it("returns null for invalid format", () => {
      expect(calculateAgeFromBirthday("15-06-2024")).toBeNull();
      expect(calculateAgeFromBirthday("invalid")).toBeNull();
      expect(calculateAgeFromBirthday("")).toBeNull();
      expect(calculateAgeFromBirthday("2024-06")).toBeNull();
    });
  });

  describe("dateToHHMM", () => {
    it("formats time in 24-hour format", () => {
      const date = new Date(2024, 0, 1, 14, 30);
      expect(dateToHHMM(date)).toBe("14:30");
    });

    it("pads single digit hours and minutes", () => {
      const date = new Date(2024, 0, 1, 9, 5);
      expect(dateToHHMM(date)).toBe("09:05");
    });

    it("handles midnight", () => {
      const date = new Date(2024, 0, 1, 0, 0);
      expect(dateToHHMM(date)).toBe("00:00");
    });

    it("handles end of day", () => {
      const date = new Date(2024, 0, 1, 23, 59);
      expect(dateToHHMM(date)).toBe("23:59");
    });
  });

  describe("HHMMToDate", () => {
    it("creates Date with specified time", () => {
      const result = HHMMToDate("14:30");
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("uses today's date", () => {
      const today = new Date();
      const result = HHMMToDate("09:15");
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getFullYear()).toBe(today.getFullYear());
    });

    it("handles midnight", () => {
      const result = HHMMToDate("00:00");
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe("time round-trip", () => {
    it("HH:MM -> Date -> HH:MM preserves value", () => {
      const times = ["00:00", "09:05", "12:30", "23:59"];
      for (const time of times) {
        const date = HHMMToDate(time);
        expect(dateToHHMM(date)).toBe(time);
      }
    });
  });
});

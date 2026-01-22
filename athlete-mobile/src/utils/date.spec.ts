import {
  dateToDDMMYYYY,
  dateToHHMM,
  DDMMYYYYToDate,
  HHMMToDate,
  addDays,
} from "./date";

describe("date utils", () => {
  describe("dateToDDMMYYYY", () => {
    it("formats date correctly", () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      const formattedDate = dateToDDMMYYYY(date);
      expect(formattedDate).toBe("05-01-2024");
    });

    it("formats date with single digit day and month", () => {
      const date = new Date(2024, 2, 9); // March 9, 2024
      const formattedDate = dateToDDMMYYYY(date);
      expect(formattedDate).toBe("09-03-2024");
    });

    it("formats date with double digit day and month", () => {
      const date = new Date(2024, 11, 25); // December 25, 2024
      const formattedDate = dateToDDMMYYYY(date);
      expect(formattedDate).toBe("25-12-2024");
    });

    it("returns the same string if already in DD-MM-YYYY format", () => {
      const dateString = "15-06-2024";
      const result = dateToDDMMYYYY(dateString);
      expect(result).toBe("15-06-2024");
    });

    it("converts ISO string to DD-MM-YYYY format", () => {
      const date = new Date("2024-06-15");
      const result = dateToDDMMYYYY(date.toISOString());
      expect(result).toBe("15-06-2024");
    });

    it("handles date string with slashes", () => {
      const dateString = "2024/06/15";
      const result = dateToDDMMYYYY(dateString);
      expect(result).toBe("15-06-2024");
    });

    it("throws error for invalid inputs", () => {
      expect(() => dateToDDMMYYYY(new Date(undefined as any))).toThrow();
      expect(() => dateToDDMMYYYY("")).toThrow();
      expect(() => dateToDDMMYYYY("AB-CD-EFGH")).toThrow();
      expect(() => dateToDDMMYYYY("invalid-date")).toThrow();
    });
  });

  describe("DDMMYYYYToDate", () => {
    it("converts DD-MM-YYYY string to Date object", () => {
      const dateString = "15-06-2024";
      const date = DDMMYYYYToDate(dateString);
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(5); // 0-indexed, so June = 5
      expect(date.getFullYear()).toBe(2024);
    });

    it("handles single digit day and month", () => {
      const dateString = "05-01-2024";
      const date = DDMMYYYYToDate(dateString);
      expect(date.getDate()).toBe(5);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getFullYear()).toBe(2024);
    });

    it("handles ISO Date strings", () => {
      const date = new Date("2024-06-15");
      const result = DDMMYYYYToDate(date.toISOString());
      expect(result.getTime()).toBe(date.getTime());
    });

    it("returns the same Date if already a Date object", () => {
      const originalDate = new Date(2024, 5, 15);
      const result = DDMMYYYYToDate(originalDate);
      expect(result.getTime()).toBe(originalDate.getTime());
    });

    it("throws error for invalid inputs", () => {
      expect(() => DDMMYYYYToDate(new Date(undefined as any))).toThrow();
      expect(() => DDMMYYYYToDate("")).toThrow();
      expect(() => DDMMYYYYToDate("AB-CD-EFGH")).toThrow();
      expect(() => DDMMYYYYToDate("invalid-date")).toThrow();
    });
  });

  describe("dateToHHMM", () => {
    it("formats time correctly for afternoon hours", () => {
      const date = new Date(2024, 0, 1, 14, 30);
      const formattedTime = dateToHHMM(date);
      expect(formattedTime).toBe("14:30");
    });

    it("formats time correctly for morning hours", () => {
      const date = new Date(2024, 0, 1, 9, 5);
      const formattedTime = dateToHHMM(date);
      expect(formattedTime).toBe("09:05");
    });

    it("formats time correctly for midnight", () => {
      const date = new Date(2024, 0, 1, 0, 0);
      const formattedTime = dateToHHMM(date);
      expect(formattedTime).toBe("00:00");
    });

    it("formats time correctly for single digit minutes", () => {
      const date = new Date(2024, 0, 1, 23, 7);
      const formattedTime = dateToHHMM(date);
      expect(formattedTime).toBe("23:07");
    });
  });

  describe("HHMMToDate", () => {
    it("converts HH:MM string to Date with today's date", () => {
      const timeString = "14:30";
      const result = HHMMToDate(timeString);
      const today = new Date();

      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getDate()).toBe(today.getDate());
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getFullYear()).toBe(today.getFullYear());
    });

    it("handles morning time", () => {
      const timeString = "09:15";
      const result = HHMMToDate(timeString);

      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(15);
    });

    it("handles midnight", () => {
      const timeString = "00:00";
      const result = HHMMToDate(timeString);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it("handles end of day", () => {
      const timeString = "23:59";
      const result = HHMMToDate(timeString);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe("date conversion round-trip", () => {
    it("converts Date to DD-MM-YYYY and back", () => {
      const originalDate = new Date(2024, 5, 15, 0, 0, 0, 0);
      const dateString = dateToDDMMYYYY(originalDate);
      const convertedDate = DDMMYYYYToDate(dateString);

      expect(convertedDate.getDate()).toBe(originalDate.getDate());
      expect(convertedDate.getMonth()).toBe(originalDate.getMonth());
      expect(convertedDate.getFullYear()).toBe(originalDate.getFullYear());
    });

    it("converts Date to HH:MM and back", () => {
      const originalDate = new Date(2024, 5, 15, 14, 30, 0, 0);
      const timeString = dateToHHMM(originalDate);
      const convertedDate = HHMMToDate(timeString);

      expect(convertedDate.getHours()).toBe(originalDate.getHours());
      expect(convertedDate.getMinutes()).toBe(originalDate.getMinutes());
    });
  });

  describe("addDays", () => {
    it("adds days within same month", () => {
      const result = addDays(new Date(2025, 0, 15), 10);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
    });

    it("adds days crossing into next month", () => {
      const result = addDays(new Date(2025, 0, 25), 10);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
      expect(result.getFullYear()).toBe(2025);
    });

    it("adds days crossing into next year", () => {
      const result = addDays(new Date(2025, 11, 28), 10);
      expect(result.getDate()).toBe(7);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2026);
    });

    it("handles adding zero days", () => {
      const result = addDays(new Date(2025, 5, 15), 0);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(5);
    });

    it("does not mutate the original date", () => {
      const original = new Date(2025, 0, 15);
      const originalTime = original.getTime();
      addDays(original, 10);
      expect(original.getTime()).toBe(originalTime);
    });
  });
});

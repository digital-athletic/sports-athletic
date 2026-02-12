import {
  formatDateTick,
  processTestHistory,
  sortTestHistoryByDate,
} from "./ChartData";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";

const createTestEntry = (testDate: number, knee = 0) => ({
  ...DEFAULT_MAX_VALUES,
  testDate,
  knee: { ...DEFAULT_MAX_VALUES.knee, barbell: knee },
});

// Timestamps for test dates (UTC midnight)
const JAN_10 = new Date("2026-01-10").getTime();
const JAN_15 = new Date("2026-01-15").getTime();
const JAN_20 = new Date("2026-01-20").getTime();
const JAN_21 = new Date("2026-01-21").getTime();
const JAN_21_AFTERNOON = JAN_21 + 6 * 60 * 60 * 1000; // 6 hours later

describe("sortTestHistoryByDate", () => {
  it("sorts entries by date with newest first", () => {
    const history = [
      createTestEntry(JAN_15),
      createTestEntry(JAN_20),
      createTestEntry(JAN_10),
    ];

    const sorted = sortTestHistoryByDate(history);

    expect(sorted.map((e) => e.testDate)).toEqual([JAN_20, JAN_15, JAN_10]);
  });

  it("returns newer entries first when dates are identical", () => {
    const history = [
      createTestEntry(JAN_21), // older entry (index 0)
      createTestEntry(JAN_21), // newer entry (index 1)
    ];

    const sorted = sortTestHistoryByDate(history);

    expect(sorted[0]).toBe(history[1]);
  });

  it("returns empty array for empty input", () => {
    expect(sortTestHistoryByDate([])).toEqual([]);
  });
});

describe("processTestHistory", () => {
  it("returns empty data for empty input", () => {
    const result = processTestHistory([]);

    expect(result).toEqual({
      dates: [],
      knee: [],
      rowing: [],
      benchPress: [],
      shoulderPress: [],
    });
  });

  it("sorts entries chronologically (oldest first)", () => {
    const history = [
      createTestEntry(JAN_20, 80),
      createTestEntry(JAN_10, 60),
      createTestEntry(JAN_15, 70),
    ];

    const result = processTestHistory(history);

    // First entry is the zero-point (day before oldest), then chronological
    expect(result.dates).toEqual([
      "2026-01-09",
      "2026-01-10",
      "2026-01-15",
      "2026-01-20",
    ]);
    expect(result.knee).toEqual([0, 60, 70, 80]);
  });

  it("handles same-day entries with correct order and suffixed dates", () => {
    const history = [
      createTestEntry(JAN_21, 100),
      createTestEntry(JAN_21_AFTERNOON, 110),
    ];

    const result = processTestHistory(history);

    // Oldest first: JAN_21 then JAN_21_AFTERNOON (same ISO date → suffix)
    expect(result.dates).toEqual(["2026-01-20", "2026-01-21", "2026-01-21-1"]);
    expect(result.knee).toEqual([0, 100, 110]);
  });

  it("prepends a zero-point one day before the oldest entry", () => {
    const history = [createTestEntry(JAN_15, 50)];

    const result = processTestHistory(history);

    expect(result.dates[0]).toBe("2026-01-14");
    expect(result.knee[0]).toBe(0);
  });
});

describe("formatDateTick", () => {
  it("formats a standard ISO 8601 date correctly", () => {
    expect(formatDateTick("2024-09-15")).toBe("15.09.");
  });

  it("formats date with single-digit day and month correctly", () => {
    expect(formatDateTick("2024-01-05")).toBe("05.01.");
  });

  it("formats year boundary date correctly", () => {
    expect(formatDateTick("2023-12-31")).toBe("31.12.");
  });

  it("returns empty string for non-string input", () => {
    expect(formatDateTick(null as unknown as string)).toBe("");
    expect(formatDateTick(undefined as unknown as string)).toBe("");
    expect(formatDateTick(123 as unknown as string)).toBe("");
  });

  it("handles date with suffix for duplicate handling", () => {
    expect(formatDateTick("2024-06-22-1")).toBe("22.06.");
  });
});

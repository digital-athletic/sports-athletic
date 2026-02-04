import { formatDateTick, sortTestHistoryByDate } from "./ChartData";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";

const createTestEntry = (testDate: string) => ({
  ...DEFAULT_MAX_VALUES,
  testDate,
});

describe("sortTestHistoryByDate", () => {
  it("sorts entries by date with newest first", () => {
    // ISO 8601 format: YYYY-MM-DD
    const history = [
      createTestEntry("2026-01-15"),
      createTestEntry("2026-01-20"),
      createTestEntry("2026-01-10"),
    ];

    const sorted = sortTestHistoryByDate(history);

    expect(sorted.map((e) => e.testDate)).toEqual([
      "2026-01-20",
      "2026-01-15",
      "2026-01-10",
    ]);
  });

  it("returns newer entries first when dates are identical", () => {
    const history = [
      createTestEntry("2026-01-21"), // older entry (index 0)
      createTestEntry("2026-01-21"), // newer entry (index 1)
    ];

    const sorted = sortTestHistoryByDate(history);

    expect(sorted[0]).toBe(history[1]);
  });

  it("returns empty array for empty input", () => {
    expect(sortTestHistoryByDate([])).toEqual([]);
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

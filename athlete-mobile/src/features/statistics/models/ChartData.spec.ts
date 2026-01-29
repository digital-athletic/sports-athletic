import { sortTestHistoryByDate } from "./ChartData";
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

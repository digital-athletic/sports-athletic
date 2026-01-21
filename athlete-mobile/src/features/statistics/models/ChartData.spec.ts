import { sortTestHistoryByDate } from "./ChartData";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";

const createTestEntry = (testDate: string) => ({
  ...DEFAULT_MAX_VALUES,
  testDate,
});

describe("sortTestHistoryByDate", () => {
  it("sorts entries by date with newest first", () => {
    const history = [
      createTestEntry("15-01-2026"),
      createTestEntry("20-01-2026"),
      createTestEntry("10-01-2026"),
    ];

    const sorted = sortTestHistoryByDate(history);

    expect(sorted.map((e) => e.testDate)).toEqual([
      "20-01-2026",
      "15-01-2026",
      "10-01-2026",
    ]);
  });

  it("returns newer entries first when dates are identical", () => {
    const history = [
      createTestEntry("21-01-2026"), // older entry (index 0)
      createTestEntry("21-01-2026"), // newer entry (index 1)
    ];

    const sorted = sortTestHistoryByDate(history);

    expect(sorted[0]).toBe(history[1]);
  });

  it("returns empty array for empty input", () => {
    expect(sortTestHistoryByDate([])).toEqual([]);
  });
});

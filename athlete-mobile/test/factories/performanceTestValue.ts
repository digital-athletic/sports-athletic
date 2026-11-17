import { type PerformanceTestValue } from "@/features/performanceTests/models/PerformanceTestValue";

/**
 * An entered 5 m sprint value of 8.1 seconds in handball, e.g. generatePerformanceTestValue({ value: 10.2, date: "2026-03-05" })
 * returns { id: "id-2026-03-01-8.1", sport: "SPORT_HANDBALL", testCode: "SPRINT_5M", date: "2026-03-05", value: 10.2 }
 */
export const generatePerformanceTestValue = (
  overrides: Partial<PerformanceTestValue> = {},
): PerformanceTestValue => ({
  id: "id-2026-03-01-8.1",
  sport: "SPORT_HANDBALL",
  testCode: "SPRINT_5M",
  date: "2026-03-01",
  value: 8.1,
  ...overrides,
});

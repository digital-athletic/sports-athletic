import { MaxValuesType } from "@/features/training/models/MaxValues";
import { formatDateToISO } from "@/utils/date";

export interface ChartDataPoint {
  x: string;
  y: number;
}

export interface PowerTestChartData {
  dates: string[];
  knee: number[];
  rowing: number[];
  benchPress: number[];
  shoulderPress: number[];
}

/**
 * Processes test history into chart-ready data.
 * Sorts entries by timestamp ascending (oldest first) for chronological chart display.
 */
export const processTestHistory = (
  history: MaxValuesType[],
): PowerTestChartData => {
  const dates: string[] = [];
  const knee: number[] = [];
  const rowing: number[] = [];
  const benchPress: number[] = [];
  const shoulderPress: number[] = [];

  if (!history || history.length === 0) {
    return { dates, knee, rowing, benchPress, shoulderPress };
  }

  // Sort by timestamp ascending (oldest first) for chronological chart display
  const sorted = [...history].sort((a, b) => a.testDate - b.testDate);

  for (const values of sorted) {
    let testDate = formatDateToISO(new Date(values.testDate));

    // Handle duplicate dates on same day by appending a counter
    const existingCount = dates.filter(
      (d) => d === testDate || d.startsWith(`${testDate}-`),
    ).length;
    if (existingCount > 0) {
      testDate = `${testDate}-${existingCount}`;
    }

    dates.push(testDate);
    knee.push(values.knee.barbell ?? 0);
    rowing.push(values.horizontalPull.barbell ?? 0);
    benchPress.push(values.horizontalPush.barbell ?? 0);
    shoulderPress.push(values.verticalPush.barbell ?? 0);
  }

  // Add starting zero-point one day before the oldest entry
  if (dates.length > 0) {
    const oldestDate = new Date(sorted[0].testDate);
    oldestDate.setDate(oldestDate.getDate() - 1);
    const startDate = formatDateToISO(oldestDate);

    dates.unshift(startDate);
    knee.unshift(0);
    rowing.unshift(0);
    benchPress.unshift(0);
    shoulderPress.unshift(0);
  }

  return { dates, knee, rowing, benchPress, shoulderPress };
};

/**
 * Converts chart data to Victory-compatible format
 */
export const toChartPoints = (
  values: number[],
  dates: string[],
): ChartDataPoint[] => {
  return values.map((value, index) => ({
    y: Math.round(value * 2) / 2,
    x: dates[index],
  }));
};

/**
 * Formats date for chart axis display as DD.MM.
 * Strips duplicate suffix (e.g., "2024-06-22-1" → "22.06.").
 */
export const formatDateTick = (dateString: string): string => {
  if (typeof dateString !== "string") return "";

  const split = dateString.split("-");
  return `${split[2]}.${split[1]}.`;
};

/**
 * Sorts test history by date (newest first)
 * When entries have the same timestamp, newer entries (higher original index) come first
 */
export const sortTestHistoryByDate = (
  history: MaxValuesType[],
): MaxValuesType[] => {
  const indexed = history.map((item, index) => ({ item, index }));

  return indexed
    .sort((a, b) => {
      const diff = b.item.testDate - a.item.testDate;
      if (diff !== 0) return diff;
      return b.index - a.index;
    })
    .map(({ item }) => item);
};

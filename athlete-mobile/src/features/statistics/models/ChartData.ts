import { MaxValuesType } from "@/features/training/models/MaxValues";

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
 * Processes test history into chart-ready data
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

  for (let i = 0; i < history.length; i++) {
    const values = history[i];
    let testDate = values.testDate;

    // Handle duplicate dates on same day
    if (dates[0] && dates[0].includes(testDate)) {
      const existingSplit = dates[0].split("-");
      if (existingSplit.length === 4) {
        const count = Number.parseInt(existingSplit[3]);
        testDate = `${testDate}-${count + 1}`;
      } else {
        testDate = `${testDate}-1`;
      }
    }

    dates.unshift(testDate);
    knee.unshift(values.knee.barbell ?? 0);
    rowing.unshift(values.horizontalPull.barbell ?? 0);
    benchPress.unshift(values.horizontalPush.barbell ?? 0);
    shoulderPress.unshift(values.verticalPush.barbell ?? 0);
  }

  // Add starting point for chart rendering
  // testDate is now in ISO 8601 format (YYYY-MM-DD)
  if (dates.length > 0) {
    const split = dates[0].split("-");
    const year = Number.parseInt(split[0]);
    const month = Number.parseInt(split[1]);
    const day = Number.parseInt(split[2]);

    let startDay = day;
    let startMonth = month;
    let startYear = year;

    if (day === 1) {
      if (month === 1) {
        startYear = year - 1;
        startMonth = 12;
        startDay = 31;
      } else {
        startMonth = month - 1;
        startDay = new Date(startYear, startMonth, 0).getDate();
      }
    } else {
      startDay = day - 1;
    }

    const startDate = `${startYear}-${startMonth.toString().padStart(2, "0")}-${startDay.toString().padStart(2, "0")}`;
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
 * Formats date for chart axis display
 * @param dateString - Date in ISO 8601 format (YYYY-MM-DD)
 */
export const formatDateTick = (dateString: string): string => {
  if (typeof dateString !== "string") return "";

  // ISO 8601 format: YYYY-MM-DD
  const split = dateString.split("-");
  // Display as DD.MM.
  return `${split[2]}.${split[1]}.`;
};

/**
 * Sorts test history by date (newest first)
 * When entries have the same date, newer entries (higher original index) come first
 * @param history - Array of MaxValuesType with testDate in ISO 8601 format (YYYY-MM-DD)
 */
export const sortTestHistoryByDate = (
  history: MaxValuesType[],
): MaxValuesType[] => {
  // Add original index to maintain insertion order for same-day entries
  const indexed = history.map((item, index) => ({ item, index }));

  return indexed
    .sort((a, b) => {
      // ISO 8601 format: YYYY-MM-DD (index 0=year, 1=month, 2=day)
      const aDate = a.item.testDate.split("-").map(Number);
      const bDate = b.item.testDate.split("-").map(Number);

      // Compare year
      if (aDate[0] !== bDate[0]) {
        return bDate[0] - aDate[0];
      }
      // Compare month
      if (aDate[1] !== bDate[1]) {
        return bDate[1] - aDate[1];
      }
      // Compare day
      if (aDate[2] !== bDate[2]) {
        return bDate[2] - aDate[2];
      }
      // Same date: newer entries (higher index) come first
      return b.index - a.index;
    })
    .map(({ item }) => item);
};

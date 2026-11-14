import { type RangeLinePoint } from "@/charts/rangeLineChartUtils";
import { type ISODateString, isISODate } from "@/utils/date";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import {
  type AthleteProfile,
  formatRangeNumber,
  referenceRangeOnDate,
} from "./referenceRange";
import { rateValue, type ValueStatus } from "./valueStatus";

const DECIMAL_INPUT = /^\d+([.,]\d+)?$/;

/** Parses a decimal with comma or point, null for empty, non numeric or negative input. */
export function parseTestValue(input: string): number | null {
  const trimmed = input.trim();
  if (!DECIMAL_INPUT.test(trimmed)) return null;

  return Number(trimmed.replace(",", "."));
}

/** A value date is allowed when it is not after today. */
export function isAllowedValueDate(
  date: ISODateString,
  today: ISODateString,
): boolean {
  return isISODate(date) && date <= today;
}

/** Sorts by date descending, the later entry first on a tie. */
export function sortNewestFirst(
  values: PerformanceTestValue[],
): PerformanceTestValue[] {
  // The sort is stable, so reversing first puts the later entry ahead on equal dates.
  return [...values].reverse().sort((a, b) => b.date.localeCompare(a.date));
}

export function latestValue(
  values: PerformanceTestValue[],
): PerformanceTestValue | null {
  const [newest] = sortNewestFirst(values);
  return newest ?? null;
}

export function testValuesKey(sport: string, testCode: string): string {
  return `${sport}/${testCode}`;
}

export type LatestResult = {
  value: PerformanceTestValue;
  /** Null when the test has no range for the athlete on the date of the value. */
  status: ValueStatus | null;
};

/** The newest value rated with the range of its own date, null without values. */
export function latestResult(
  test: SportTest,
  athlete: AthleteProfile,
  values: PerformanceTestValue[],
): LatestResult | null {
  const latest = latestValue(values);
  if (latest === null) return null;

  const range = referenceRangeOnDate(test, athlete, latest.date);
  return {
    value: latest,
    status: range ? rateValue(latest.value, range) : null,
  };
}

/** Chart points oldest first, each with the range of its own date. */
export function rangeLinePoints(
  test: SportTest,
  athlete: AthleteProfile,
  values: PerformanceTestValue[],
): RangeLinePoint[] {
  return sortNewestFirst(values)
    .reverse()
    .map(({ date, value }) => ({
      date,
      value,
      range: referenceRangeOnDate(test, athlete, date),
    }));
}

/** A value with its unit in the number format of the language, e.g. "8,1 s" in German. */
export function formatValueWithUnit(
  value: number,
  unit: string,
  language: string,
): string {
  return `${formatRangeNumber(value, language)} ${unit}`;
}

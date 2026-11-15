import { daysBetweenISODates, type ISODateString } from "@/utils/date";

export type RangeLinePoint = {
  date: ISODateString;
  value: number;
  range: { rangeStart: number; rangeEnd: number } | null;
};

export type ChartSize = { width: number; height: number };

export type RangeLineGeometry = {
  line: { x: number; y: number }[];
  bands: { x: number; width: number; y: number; height: number }[];
  yTicks: { y: number; value: number }[];
};

type Range = { rangeStart: number; rangeEnd: number };

const Y_TICK_COUNT = 4;
const Y_PADDING_SHARE = 0.1;

/** Lowest and highest value shown, widened to a spread of 2 when all values are equal. */
function valueExtent(points: RangeLinePoint[]): { min: number; max: number } {
  const shown = points.flatMap(({ value, range }) =>
    range ? [value, range.rangeStart, range.rangeEnd] : [value],
  );
  const min = Math.min(...shown);
  const max = Math.max(...shown);
  if (min === max) return { min: min - 1, max: max + 1 };
  return { min, max };
}

/** Horizontal positions by date, or by index when all points share one date. */
function xPositions(points: RangeLinePoint[], width: number): number[] {
  if (points.length === 1) return [width / 2];

  const firstDate = points[0].date;
  const spanDays = daysBetweenISODates(
    firstDate,
    points[points.length - 1].date,
  );
  return points.map((point, index) => {
    if (spanDays === 0) return (width * index) / (points.length - 1);
    return (width * daysBetweenISODates(firstDate, point.date)) / spanDays;
  });
}

function isSameRange(a: Range | null, b: Range | null): boolean {
  if (a === null || b === null) return a === b;
  return a.rangeStart === b.rangeStart && a.rangeEnd === b.rangeEnd;
}

/** Index ranges [first, last] of neighbouring points that have the same range. */
function stretchesOfEqualRange(points: RangeLinePoint[]): [number, number][] {
  const stretches: [number, number][] = [];
  points.forEach((point, index) => {
    const last = stretches[stretches.length - 1];
    if (last && isSameRange(points[last[0]].range, point.range)) {
      last[1] = index;
      return;
    }
    stretches.push([index, index]);
  });
  return stretches;
}

/**
 * Positions in a chart of the given size for points ordered oldest first.
 * The y axis covers every value and range bound plus 10 percent, a larger value is higher up.
 */
export function buildRangeLineGeometry(
  points: RangeLinePoint[],
  size: ChartSize,
): RangeLineGeometry {
  if (points.length === 0) return { line: [], bands: [], yTicks: [] };

  const { min, max } = valueExtent(points);
  const padding = (max - min) * Y_PADDING_SHARE;
  const domainMin = min - padding;
  const domainSpan = max + padding - domainMin;
  const toY = (value: number): number =>
    size.height * (1 - (value - domainMin) / domainSpan);

  const xs = xPositions(points, size.width);
  const line = points.map((point, index) => ({
    x: xs[index],
    y: toY(point.value),
  }));

  const bands = stretchesOfEqualRange(points).flatMap(([first, last]) => {
    const range = points[first].range;
    if (range === null) return [];

    const x = first === 0 ? 0 : (xs[first - 1] + xs[first]) / 2;
    const right =
      last === points.length - 1 ? size.width : (xs[last] + xs[last + 1]) / 2;
    const top = toY(Math.max(range.rangeStart, range.rangeEnd));
    const bottom = toY(Math.min(range.rangeStart, range.rangeEnd));
    return [{ x, width: right - x, y: top, height: bottom - top }];
  });

  const yTicks = Array.from({ length: Y_TICK_COUNT }, (_, index) => {
    const value = max - ((max - min) * index) / (Y_TICK_COUNT - 1);
    return { y: toY(value), value };
  });

  return { line, bands, yTicks };
}

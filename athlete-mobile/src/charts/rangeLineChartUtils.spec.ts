import {
  buildRangeLineGeometry,
  type ChartSize,
  type RangeLinePoint,
} from "./rangeLineChartUtils";

const chartSize: ChartSize = { width: 300, height: 200 };

/**
 * A point with a value of 8.1 inside the range 9.87 to 6.54, e.g.
 * generateRangeLinePoint({ date: "2026-03-11", value: 10.2 }) returns
 * { date: "2026-03-11", value: 10.2, range: { rangeStart: 9.87, rangeEnd: 6.54 } }
 */
const generateRangeLinePoint = (
  overrides: Partial<RangeLinePoint> = {},
): RangeLinePoint => ({
  date: "2026-03-01",
  value: 8.1,
  range: { rangeStart: 9.87, rangeEnd: 6.54 },
  ...overrides,
});

describe("buildRangeLineGeometry: line", () => {
  it("moves right when the date is later", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01" }),
        generateRangeLinePoint({ date: "2026-03-05" }),
        generateRangeLinePoint({ date: "2026-03-21" }),
      ],
      chartSize,
    );

    expect(geometry.line[0].x).toBeLessThan(geometry.line[1].x);
    expect(geometry.line[1].x).toBeLessThan(geometry.line[2].x);
  });

  it("places a larger value higher up with a smaller y", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01", value: 6.1 }),
        generateRangeLinePoint({ date: "2026-03-11", value: 10.2 }),
      ],
      chartSize,
    );

    expect(geometry.line[1].y).toBeLessThan(geometry.line[0].y);
  });

  it("centres a single point horizontally", () => {
    const geometry = buildRangeLineGeometry(
      [generateRangeLinePoint()],
      chartSize,
    );

    expect(geometry.line).toHaveLength(1);
    expect(geometry.line[0].x).toBe(chartSize.width / 2);
  });

  it("spreads points with equal dates from left to right", () => {
    const geometry = buildRangeLineGeometry(
      [generateRangeLinePoint(), generateRangeLinePoint({ value: 7 })],
      chartSize,
    );

    expect(geometry.line[0].x).toBeLessThan(geometry.line[1].x);
  });

  it("keeps every point inside the chart", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01", value: 6.1 }),
        generateRangeLinePoint({ date: "2026-03-11", value: 10.2 }),
      ],
      chartSize,
    );

    for (const { x, y } of geometry.line) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(chartSize.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(chartSize.height);
    }
  });
});

describe("buildRangeLineGeometry: bands", () => {
  it("keeps a band fully inside the chart height when the range is wider than the values", () => {
    const geometry = buildRangeLineGeometry(
      [generateRangeLinePoint({ value: 8.1 })],
      chartSize,
    );

    expect(geometry.bands).toHaveLength(1);
    expect(geometry.bands[0].height).toBeGreaterThan(0);
    expect(geometry.bands[0].y).toBeGreaterThanOrEqual(0);
    expect(geometry.bands[0].y + geometry.bands[0].height).toBeLessThanOrEqual(
      chartSize.height,
    );
  });

  it("draws the band wider than the values when the line is far outside the range", () => {
    const geometry = buildRangeLineGeometry(
      [generateRangeLinePoint({ value: 14.3 })],
      chartSize,
    );

    expect(geometry.bands[0].y).toBeGreaterThanOrEqual(0);
    expect(geometry.bands[0].y + geometry.bands[0].height).toBeLessThanOrEqual(
      chartSize.height,
    );
  });

  it("draws one band for points with the same range", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01" }),
        generateRangeLinePoint({ date: "2026-03-11" }),
        generateRangeLinePoint({ date: "2026-03-21" }),
      ],
      chartSize,
    );

    expect(geometry.bands).toHaveLength(1);
  });

  it("switches the band at the midpoint between two points when the range changes", () => {
    const nextStageRange = { rangeStart: 9.12, rangeEnd: 6.01 };

    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01" }),
        generateRangeLinePoint({ date: "2026-03-11" }),
        generateRangeLinePoint({ date: "2026-03-21", range: nextStageRange }),
      ],
      chartSize,
    );

    const midpoint = (geometry.line[1].x + geometry.line[2].x) / 2;
    expect(geometry.bands).toHaveLength(2);
    expect(geometry.bands[0].x + geometry.bands[0].width).toBeCloseTo(midpoint);
    expect(geometry.bands[1].x).toBeCloseTo(midpoint);
  });

  it("draws no band for points without a range", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01", range: null }),
        generateRangeLinePoint({ date: "2026-03-11", range: null }),
      ],
      chartSize,
    );

    expect(geometry.bands).toEqual([]);
  });

  it("draws a band only for the points that have a range", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01", range: null }),
        generateRangeLinePoint({ date: "2026-03-11" }),
      ],
      chartSize,
    );

    expect(geometry.bands).toHaveLength(1);
  });
});

describe("buildRangeLineGeometry: empty and ticks", () => {
  it("returns an empty line and no bands for no points", () => {
    const geometry = buildRangeLineGeometry([], chartSize);

    expect(geometry.line).toEqual([]);
    expect(geometry.bands).toEqual([]);
  });

  it("returns 4 y ticks", () => {
    const geometry = buildRangeLineGeometry(
      [
        generateRangeLinePoint({ date: "2026-03-01", value: 6.1 }),
        generateRangeLinePoint({ date: "2026-03-11", value: 10.2 }),
      ],
      chartSize,
    );

    expect(geometry.yTicks).toHaveLength(4);
  });

  it("orders the y ticks from the highest value at the top to the lowest at the bottom", () => {
    const geometry = buildRangeLineGeometry(
      [generateRangeLinePoint({ value: 10.2 })],
      chartSize,
    );

    const values = geometry.yTicks.map((tick) => tick.value);
    const ys = geometry.yTicks.map((tick) => tick.y);
    expect([...values].sort((a, b) => b - a)).toEqual(values);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });
});

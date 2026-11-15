import { fireEvent, render } from "@/utils/testUtils";
import { RangeLineChart } from "./RangeLineChart";
import { type RangeLinePoint } from "./rangeLineChartUtils";

/**
 * A point with the range 9.87 to 6.54 s, e.g. generatePointWithRange("2026-03-01", 8.1) returns
 * { date: "2026-03-01", value: 8.1, range: { rangeStart: 9.87, rangeEnd: 6.54 } }
 */
const generatePointWithRange = (
  date: string,
  value: number,
): RangeLinePoint => ({
  date,
  value,
  range: { rangeStart: 9.87, rangeEnd: 6.54 },
});

/**
 * A point without a range, e.g. generatePointWithoutRange("2026-03-01", 8.1) returns
 * { date: "2026-03-01", value: 8.1, range: null }
 */
const generatePointWithoutRange = (
  date: string,
  value: number,
): RangeLinePoint => ({ date, value, range: null });

const LAYOUT_EVENT = { nativeEvent: { layout: { width: 320 } } };

describe("RangeLineChart: rendering", () => {
  it("renders the chart with the given test id", async () => {
    const { getByTestId } = await render(
      <RangeLineChart
        testID="range-line-chart"
        unit="s"
        points={[generatePointWithRange("2026-03-01", 8.1)]}
      />,
    );

    expect(getByTestId("range-line-chart")).toBeTruthy();
  });

  it("renders nothing for empty points", async () => {
    const { queryByTestId } = await render(
      <RangeLineChart testID="range-line-chart" unit="s" points={[]} />,
    );

    expect(queryByTestId("range-line-chart")).toBeNull();
  });

  it("describes the chart with the number of values", async () => {
    const { getByLabelText } = await render(
      <RangeLineChart
        testID="range-line-chart"
        unit="s"
        points={[
          generatePointWithRange("2026-03-01", 8.1),
          generatePointWithRange("2026-03-08", 7.9),
        ]}
      />,
    );

    expect(getByLabelText("Line chart with 2 values over time")).toBeTruthy();
  });
});

describe("RangeLineChart: range band", () => {
  it("renders the band after the layout when the points have a range", async () => {
    const { getByTestId, getAllByTestId } = await render(
      <RangeLineChart
        testID="range-line-chart"
        unit="s"
        points={[
          generatePointWithRange("2026-03-01", 8.1),
          generatePointWithRange("2026-03-08", 7.9),
        ]}
      />,
    );

    await fireEvent(getByTestId("range-line-chart"), "layout", LAYOUT_EVENT);

    expect(getAllByTestId("range-line-chart-band")).toHaveLength(1);
  });

  it("renders no band when the points have no range", async () => {
    const { getByTestId, queryByTestId } = await render(
      <RangeLineChart
        testID="range-line-chart"
        unit="s"
        points={[
          generatePointWithoutRange("2026-03-01", 8.1),
          generatePointWithoutRange("2026-03-08", 7.9),
        ]}
      />,
    );

    await fireEvent(getByTestId("range-line-chart"), "layout", LAYOUT_EVENT);

    expect(queryByTestId("range-line-chart-band")).toBeNull();
  });

  it("renders no band before the layout is known", async () => {
    const { queryByTestId } = await render(
      <RangeLineChart
        testID="range-line-chart"
        unit="s"
        points={[generatePointWithRange("2026-03-01", 8.1)]}
      />,
    );

    expect(queryByTestId("range-line-chart-band")).toBeNull();
  });
});

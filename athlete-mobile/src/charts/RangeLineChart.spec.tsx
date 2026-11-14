import { render } from "@/utils/testUtils";
import { RangeLineChart } from "./RangeLineChart";

describe("RangeLineChart: rendering", () => {
  it("renders the chart with the given test id", async () => {
    const { getByTestId } = await render(
      <RangeLineChart
        testID="range-line-chart"
        unit="s"
        points={[
          {
            date: "2026-03-01",
            value: 8.1,
            range: { rangeStart: 9.87, rangeEnd: 6.54 },
          },
        ]}
      />,
    );

    expect(getByTestId("range-line-chart")).toBeTruthy();
  });
});

import { render } from "@/utils/testUtils";
import { PowerTest } from "./PowerTest";

// Default mock chart data
const mockChartData = {
  dates: ["2024-06-30", "2024-07-06", "2024-09-04"],
  kneeDominant: [0, 80, 85],
  rowing: [0, 50, 55],
  benchPress: [0, 60, 65],
  shoulderPress: [0, 35, 40],
};

// Mock the data hook
const mockUsePowerTestData = jest.fn();

jest.mock("@/features/statistics/hooks/usePowerTestData", () => ({
  usePowerTestData: () => mockUsePowerTestData(),
}));

// Capture props passed to the chart library
let capturedProps: Record<string, unknown> | null = null;

jest.mock("react-native-gifted-charts", () => ({
  LineChart: (props: Record<string, unknown>) => {
    capturedProps = props;
    const { View } = require("react-native");
    return <View testID="gifted-line-chart" />;
  },
}));

describe("PowerTest LineChart", () => {
  beforeEach(() => {
    capturedProps = null;
    mockUsePowerTestData.mockReturnValue({
      chartData: mockChartData,
      hasChartData: true,
    });
  });

  describe("data transformation", () => {
    it("passes primary data series with inline labels", () => {
      render(<PowerTest />);

      const data = capturedProps?.data as {
        value: number;
        label?: string;
        showXAxisIndex?: boolean;
      }[];
      expect(data[0]).toEqual({
        value: 0,
        label: "30.06.",
        showXAxisIndex: false,
      });
      expect(data[1]).toEqual({
        value: 80,
        label: "06.07.",
        showXAxisIndex: false,
      });
      expect(data[2]).toEqual({
        value: 85,
        label: "04.09.",
        showXAxisIndex: false,
      });
    });

    it("does not pass xAxisLabelTexts prop (labels are inline)", () => {
      render(<PowerTest />);

      expect(capturedProps?.xAxisLabelTexts).toBeUndefined();
    });

    it("passes secondary series without labels", () => {
      render(<PowerTest />);

      const data2 = capturedProps?.data2 as { value: number }[];
      expect(data2[1]).toEqual({ value: 60 });
      expect(data2[1]).not.toHaveProperty("label");
    });

    it("passes all four data series with correct colors", () => {
      render(<PowerTest />);

      expect({
        color: capturedProps?.color,
        color2: capturedProps?.color2,
        color3: capturedProps?.color3,
        color4: capturedProps?.color4,
      }).toEqual({
        color: "#000000",
        color2: "#6DC33F",
        color3: "#4791DE",
        color4: "#F46E70",
      });
    });
  });

  describe("chart configuration", () => {
    it("passes correct Y-axis configuration", () => {
      render(<PowerTest />);

      expect({
        maxValue: capturedProps?.maxValue,
        noOfSections: capturedProps?.noOfSections,
      }).toEqual({
        maxValue: 120,
        noOfSections: 6,
      });
    });

    it("hides all data points to match design", () => {
      render(<PowerTest />);

      expect({
        hideDataPoints: capturedProps?.hideDataPoints,
        hideDataPoints2: capturedProps?.hideDataPoints2,
        hideDataPoints3: capturedProps?.hideDataPoints3,
        hideDataPoints4: capturedProps?.hideDataPoints4,
      }).toEqual({
        hideDataPoints: true,
        hideDataPoints2: true,
        hideDataPoints3: true,
        hideDataPoints4: true,
      });
    });

    it("disables vertical grid lines", () => {
      render(<PowerTest />);

      expect(capturedProps?.showVerticalLines).toBe(false);
    });
  });

  describe("empty data handling", () => {
    it("returns null when chart data is empty", () => {
      mockUsePowerTestData.mockReturnValue({
        chartData: {
          dates: [],
          kneeDominant: [],
          rowing: [],
          benchPress: [],
          shoulderPress: [],
        },
        hasChartData: false,
      });

      const { queryByTestId } = render(<PowerTest />);

      expect(queryByTestId("power-test-line-chart")).toBeNull();
    });

    it("does not render chart component when data is empty", () => {
      mockUsePowerTestData.mockReturnValue({
        chartData: {
          dates: [],
          kneeDominant: [],
          rowing: [],
          benchPress: [],
          shoulderPress: [],
        },
        hasChartData: false,
      });

      render(<PowerTest />);

      expect(capturedProps).toBeNull();
    });
  });
});

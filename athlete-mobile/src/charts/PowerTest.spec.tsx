import type { PowerTestChartData } from "@/features/statistics/models/ChartData";
import { render } from "@/utils/testUtils";
import { PowerTest } from "./PowerTest";

// Chart data with three dates, e.g. squat [0, 80, 85] on 2024-06-30, 2024-07-06, 2024-09-04
const generatePowerTestChartData = (): PowerTestChartData => ({
  dates: ["2024-06-30", "2024-07-06", "2024-09-04"],
  kneeDominant: [0, 80, 85],
  deadlift: [0, 70, 75],
  rowing: [0, 50, 55],
  benchPress: [0, 60, 65],
  shoulderPress: [0, 35, 40],
});

// Chart data without any date, e.g. every series is []
const generateEmptyPowerTestChartData = (): PowerTestChartData => ({
  dates: [],
  kneeDominant: [],
  deadlift: [],
  rowing: [],
  benchPress: [],
  shoulderPress: [],
});

const mockUsePowerTestData = jest.fn();

jest.mock("@/features/statistics/hooks/usePowerTestData", () => ({
  usePowerTestData: () => mockUsePowerTestData(),
}));

interface RenderedNode {
  props: Record<string, unknown>;
  children: (RenderedNode | string)[] | null;
}

const collectPropNames = (
  node: RenderedNode | RenderedNode[] | null,
): string[] => {
  if (node === null) return [];
  if (Array.isArray(node)) return node.flatMap(collectPropNames);
  const children = (node.children ?? []).filter(
    (child): child is RenderedNode => typeof child !== "string",
  );
  return [...Object.keys(node.props), ...children.flatMap(collectPropNames)];
};

// Collects every text string of the rendered tree: ["0 kg", "30.06."]
const collectTexts = (node: RenderedNode | RenderedNode[] | null): string[] => {
  if (node === null) return [];
  if (Array.isArray(node)) return node.flatMap(collectTexts);
  // react-native-svg renders text natively as a "content" prop, not as a string child
  const ownText =
    typeof node.props.content === "string" ? [node.props.content] : [];
  return [
    ...ownText,
    ...(node.children ?? []).flatMap((child) =>
      typeof child === "string" ? [child] : collectTexts(child),
    ),
  ];
};

describe("PowerTest: line chart", () => {
  beforeEach(() => {
    mockUsePowerTestData.mockReturnValue({
      chartData: generatePowerTestChartData(),
      hasChartData: true,
    });
  });

  it("renders nothing without dates", async () => {
    mockUsePowerTestData.mockReturnValue({
      chartData: generateEmptyPowerTestChartData(),
      hasChartData: false,
    });

    const { queryByTestId } = await render(<PowerTest />);

    expect(queryByTestId("power-test-line-chart")).toBeNull();
  });

  it("renders the line chart container", async () => {
    const { getByTestId } = await render(<PowerTest />);

    expect(getByTestId("power-test-line-chart")).toBeTruthy();
  });

  it("renders y axis labels in steps of 20 with a kg suffix", async () => {
    const { toJSON } = await render(<PowerTest />);
    const texts = collectTexts(toJSON());

    for (const label of [
      "0 kg",
      "20 kg",
      "40 kg",
      "60 kg",
      "80 kg",
      "100 kg",
      "120 kg",
    ]) {
      expect(texts).toContain(label);
    }
  });

  it("renders the formatted date for every x axis label", async () => {
    const { toJSON } = await render(<PowerTest />);
    const texts = collectTexts(toJSON());

    for (const label of ["30.06.", "06.07.", "04.09."]) {
      expect(texts).toContain(label);
    }
  });

  it("renders one line for each of the five series", async () => {
    const { queryByTestId } = await render(<PowerTest />);

    const lines = [
      "squad",
      "deadlift",
      "benchPress",
      "rowing",
      "shoulderPress",
    ].map((key) => queryByTestId(`power-test-line-${key}`));

    expect(lines.filter((line) => line !== null)).toHaveLength(5);
  });

  it("passes no translateX, translateY or collapsable props to any element", async () => {
    const { toJSON } = await render(<PowerTest />);

    const forbiddenProps = collectPropNames(toJSON()).filter((name) =>
      ["translateX", "translateY", "collapsable"].includes(name),
    );

    expect(forbiddenProps).toEqual([]);
  });
});

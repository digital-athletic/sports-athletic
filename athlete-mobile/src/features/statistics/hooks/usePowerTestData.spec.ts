import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { act, renderHook } from "@testing-library/react-native";
import { usePowerTestData } from "./usePowerTestData";

const DAY = 1000 * 60 * 60 * 24;

describe("usePowerTestData: range filter", () => {
  const recent = Date.now() - DAY;
  const old = Date.now() - 100 * DAY;

  beforeEach(() => {
    act(() => {
      useExerciseProgressStore.setState({
        testHistory: [
          { ...DEFAULT_MAX_VALUES, testAt: old },
          { ...DEFAULT_MAX_VALUES, testAt: recent },
        ],
      });
    });
  });

  afterEach(() => {
    act(() => {
      useExerciseProgressStore.setState({ testHistory: [] });
    });
  });

  it("keeps the whole history without a scale", () => {
    const { result } = renderHook(() => usePowerTestData());

    expect(result.current.testHistory).toHaveLength(2);
    expect(result.current.sortedHistory).toHaveLength(2);
  });

  it("keeps the whole history for total", () => {
    const { result } = renderHook(() => usePowerTestData({ scale: "total" }));

    expect(result.current.testHistory).toHaveLength(2);
  });

  it("filters history and chart data by the scale", () => {
    const { result } = renderHook(() => usePowerTestData({ scale: "month" }));

    expect(result.current.testHistory.map((test) => test.testAt)).toEqual([
      recent,
    ]);
    expect(result.current.sortedHistory).toHaveLength(1);
    // One entry plus the leading zero point
    expect(result.current.chartData.dates).toHaveLength(2);
  });

  it("reports no history when the range holds no strength test", () => {
    act(() => {
      useExerciseProgressStore.setState({
        testHistory: [{ ...DEFAULT_MAX_VALUES, testAt: old }],
      });
    });

    const { result } = renderHook(() => usePowerTestData({ scale: "week" }));

    expect(result.current.hasHistory).toBe(false);
    expect(result.current.hasChartData).toBe(false);
  });
});

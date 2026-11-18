import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { act, renderHook } from "@testing-library/react-native";
import { generatePerformanceTestValue } from "@test/factories/performanceTestValue";
import { generateSportTest } from "@test/factories/sportTest";
import { usePerformanceTestsExport } from "./usePerformanceTestsExport";

const mockShareCsv = jest.fn();
const mockAlert = jest.fn();

jest.mock("@/services/shareFile", () => ({
  shareCsv: (...args: unknown[]) => mockShareCsv(...args),
}));

jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

const BOM = String.fromCharCode(0xfeff);

const SPRINT = generateSportTest("SPRINT_5M", [], {
  en: { name: "5 m sprint" },
});

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 18, 10, 0) });
  mockShareCsv.mockReset().mockResolvedValue(undefined);
  mockAlert.mockReset();
  usePerformanceTestValuesStore.setState({ values: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("usePerformanceTestsExport: with recorded results", () => {
  beforeEach(() => {
    usePerformanceTestValuesStore.setState({
      values: [generatePerformanceTestValue()],
    });
  });

  it("shares every result as CSV named after today", async () => {
    const { result } = await renderHook(() =>
      usePerformanceTestsExport([SPRINT]),
    );

    await act(() => result.current.exportCsv());

    expect(mockShareCsv).toHaveBeenCalledTimes(1);
    const [fileName, csv] = mockShareCsv.mock.calls[0] as [string, string];
    expect(fileName).toBe("performance-tests_2026-11-18.csv");
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      [
        "more.performanceTests.export.headers.date",
        "more.performanceTests.export.headers.sport",
        "more.performanceTests.export.headers.test",
        "more.performanceTests.export.headers.value",
        "more.performanceTests.export.headers.unit",
      ].join(","),
      "2026-03-01,sports.SPORT_HANDBALL,5 m sprint,8.1,s",
      "",
    ]);
    expect(mockAlert).not.toHaveBeenCalled();
  });
});

describe("usePerformanceTestsExport: without recorded results", () => {
  it("shows a message instead of sharing an empty file", async () => {
    const { result } = await renderHook(() =>
      usePerformanceTestsExport([SPRINT]),
    );

    await act(() => result.current.exportCsv());

    expect(mockShareCsv).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      "more.performanceTests.export.noResults",
    );
  });
});

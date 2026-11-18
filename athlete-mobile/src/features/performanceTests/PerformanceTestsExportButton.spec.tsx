import i18n from "@/i18n";
import { fireEvent, render } from "@/utils/testUtils";
import { generateSportTest } from "@test/factories/sportTest";
import { PerformanceTestsExportButton } from "./PerformanceTestsExportButton";

const mockUsePerformanceTestsExport = jest.fn();
const mockExportCsv = jest.fn();

jest.mock("./usePerformanceTestsExport", () => ({
  usePerformanceTestsExport: (...args: unknown[]) =>
    mockUsePerformanceTestsExport(...args),
}));

const TESTS = [generateSportTest("SPRINT_5M")];

describe("PerformanceTestsExportButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exports on press with its accessible label", async () => {
    mockUsePerformanceTestsExport.mockReturnValue({
      exportCsv: mockExportCsv,
      isExporting: false,
    });
    const { getByTestId } = await render(
      <PerformanceTestsExportButton tests={TESTS} />,
    );

    const button = getByTestId("performance-tests-export-button");
    expect(button.props.accessibilityLabel).toBe(
      i18n.t("more.performanceTests.export.label"),
    );

    await fireEvent.press(button);

    expect(mockExportCsv).toHaveBeenCalledTimes(1);
  });

  it("ignores presses while an export runs", async () => {
    mockUsePerformanceTestsExport.mockReturnValue({
      exportCsv: mockExportCsv,
      isExporting: true,
    });
    const { getByTestId } = await render(
      <PerformanceTestsExportButton tests={TESTS} />,
    );

    const button = getByTestId("performance-tests-export-button");
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });

    await fireEvent.press(button);

    expect(mockExportCsv).not.toHaveBeenCalled();
  });
});

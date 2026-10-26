import i18n from "@/i18n";
import { fireEvent, render } from "@/utils/testUtils";
import { StatisticsExportButton } from "./StatisticsExportButton";

const mockUseStatisticsExport = jest.fn();
const mockExportCsv = jest.fn();

jest.mock("@/features/statistics/hooks/useStatisticsExport", () => ({
  useStatisticsExport: (...args: unknown[]) => mockUseStatisticsExport(...args),
}));

describe("StatisticsExportButton: states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes the kind and range to the export hook", async () => {
    mockUseStatisticsExport.mockReturnValue({
      canExport: true,
      exportCsv: mockExportCsv,
    });

    await render(
      <StatisticsExportButton kind="strength-tests" scale="month" />,
    );

    expect(mockUseStatisticsExport).toHaveBeenCalledWith({
      kind: "strength-tests",
      scale: "month",
    });
  });

  it("exposes an accessible label and exports on press", async () => {
    mockUseStatisticsExport.mockReturnValue({
      canExport: true,
      exportCsv: mockExportCsv,
    });
    const { getByTestId, getByText } = await render(
      <StatisticsExportButton kind="workouts" scale="total" />,
    );

    const button = getByTestId("statistics-export-button");
    expect(getByText(i18n.t("statistics.export.button"))).toBeTruthy();
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityLabel).toBe(
      i18n.t("statistics.export.label"),
    );

    fireEvent.press(button);

    expect(mockExportCsv).toHaveBeenCalledTimes(1);
  });

  it("is disabled and ignores presses when nothing can be exported", async () => {
    mockUseStatisticsExport.mockReturnValue({
      canExport: false,
      exportCsv: mockExportCsv,
    });
    const { getByTestId } = await render(
      <StatisticsExportButton kind="workouts" scale="total" />,
    );

    const button = getByTestId("statistics-export-button");
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(button);

    expect(mockExportCsv).not.toHaveBeenCalled();
  });
});

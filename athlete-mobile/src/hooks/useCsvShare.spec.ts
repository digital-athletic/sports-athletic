import { Logger } from "@/services/Logger";
import { act, renderHook } from "@testing-library/react-native";
import { useCsvShare } from "./useCsvShare";

const mockShareCsv = jest.fn();
const mockAlert = jest.fn();

jest.mock("@/services/shareCsv", () => ({
  shareCsv: (...args: unknown[]) => mockShareCsv(...args),
}));

jest.mock("@/common/Alert", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  mockShareCsv.mockReset().mockResolvedValue(undefined);
  mockAlert.mockReset();
});

describe("useCsvShare", () => {
  it("shares the CSV under the file name", async () => {
    const { result } = await renderHook(() => useCsvShare());

    await act(() => result.current.share("export.csv", "a,b\r\n"));

    expect(mockShareCsv).toHaveBeenCalledWith("export.csv", "a,b\r\n");
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("reports sharing while the share runs", async () => {
    let finishShare = (): void => undefined;
    mockShareCsv.mockReturnValue(
      new Promise<void>((resolve) => {
        finishShare = resolve;
      }),
    );
    const { result } = await renderHook(() => useCsvShare());

    let pending: Promise<void> = Promise.resolve();
    await act(async () => {
      pending = result.current.share("export.csv", "csv");
    });
    expect(result.current.isSharing).toBe(true);

    await act(async () => {
      finishShare();
      await pending;
    });
    expect(result.current.isSharing).toBe(false);
  });

  it("shares once when called again before the first share ends", async () => {
    let finishShare = (): void => undefined;
    mockShareCsv.mockReturnValue(
      new Promise<void>((resolve) => {
        finishShare = resolve;
      }),
    );
    const { result } = await renderHook(() => useCsvShare());

    await act(async () => {
      const first = result.current.share("export.csv", "csv");
      const second = result.current.share("export.csv", "csv");
      finishShare();
      await Promise.all([first, second]);
    });

    expect(mockShareCsv).toHaveBeenCalledTimes(1);
  });

  it("logs the error and alerts instead of throwing when sharing fails", async () => {
    const error = new Error("share failed");
    mockShareCsv.mockRejectedValue(error);
    const logError = jest.spyOn(Logger, "logError").mockImplementation();
    const { result } = await renderHook(() => useCsvShare());

    await act(() => result.current.share("export.csv", "csv"));

    expect(logError).toHaveBeenCalledWith(error);
    expect(mockAlert).toHaveBeenCalledWith("common.error");
    expect(result.current.isSharing).toBe(false);
  });

  it("wraps a thrown non error value before logging it", async () => {
    mockShareCsv.mockRejectedValue("share failed");
    const logError = jest.spyOn(Logger, "logError").mockImplementation();
    const { result } = await renderHook(() => useCsvShare());

    await act(() => result.current.share("export.csv", "csv"));

    expect(logError).toHaveBeenCalledWith(new Error("CSV export failed"));
  });
});

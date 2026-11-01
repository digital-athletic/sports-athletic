import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useTrainingListLifecycle } from "./useTrainingListLifecycle";

jest.mock("@/features/training/hooks/useTrainingScreenLifecycle", () => ({
  useTrainingScreenLifecycle: () => ({ isScreenFocused: true }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useTrainingListLifecycle: abort", () => {
  beforeEach(() => {
    alertSpy.mockClear();
  });

  it("finishes the training as aborted when the athlete confirms", async () => {
    const onFinish = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingListLifecycle({ onFinish }),
    );

    await act(() => {
      result.current.handleAbort();
    });
    const buttons = alertSpy.mock.calls[0]?.[2];
    const confirmButton = buttons?.find((b) => b.text === "common.yes");
    await act(() => {
      confirmButton?.onPress?.();
    });

    expect(onFinish).toHaveBeenCalledWith(true);
  });
});

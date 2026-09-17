import { Alert } from "@/common/Alert";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingAlerts } from "./useTrainingAlerts";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

beforeEach(() => {
  jest.spyOn(Alert, "alert");
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useTrainingAlerts: showPainAlert", () => {
  it("shows the pain alert and runs the callback on OK", () => {
    const onAcknowledge = jest.fn();
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.showPainAlert(onAcknowledge);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "training.active.strengthTestAlert.title",
      "training.active.strengthTestAlert.message",
      expect.any(Array),
    );
    expect(onAcknowledge).not.toHaveBeenCalled();

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => {
      buttons[0].onPress();
    });
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });
});

describe("useTrainingAlerts: maybeShowBarbellAlert", () => {
  it("shows the barbell alert for a TEST_WORKOUT whose next exercise carries barbell equipment", () => {
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_BARBELL"] },
        "TEST_WORKOUT",
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "training.active.weightCalculationAlert.title",
      "training.active.weightCalculationAlert.message",
      expect.any(Array),
    );
  });

  it("does not show the barbell alert for a non TEST_WORKOUT training type", () => {
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowBarbellAlert({ tags: ["EQ_BARBELL"] }, "PLAN");
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("does not show the barbell alert when the next exercise has no barbell equipment", () => {
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_DUMBBELL"] },
        "TEST_WORKOUT",
      );
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("one shot: suppresses the barbell alert after acknowledging it once", () => {
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_BARBELL"] },
        "TEST_WORKOUT",
      );
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => {
      buttons[0].onPress();
    });

    act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_BARBELL"] },
        "TEST_WORKOUT",
      );
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});

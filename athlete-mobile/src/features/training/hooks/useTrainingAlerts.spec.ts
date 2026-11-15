import { Alert } from "@/common/Alert";
import { useUserProfileStore } from "@/store/userProfileStore";
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

describe("useTrainingAlerts: maybeShowPainAlert", () => {
  const kneePain = { PAIN: ["KNEE_LEFT"] };

  beforeEach(() => {
    useUserProfileStore.setState({ warnings: { painAlertSeen: false } });
  });

  const pressOk = async (callIndex: number) => {
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[callIndex];
    await act(() => {
      buttons[0].onPress();
    });
  };

  it("shows the pain alert and continues only on OK", async () => {
    const onContinue = jest.fn();
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue,
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "training.active.strengthTestAlert.title",
      "training.active.strengthTestAlert.message",
      expect.any(Array),
      expect.objectContaining({ cancelable: true }),
    );
    expect(onContinue).not.toHaveBeenCalled();

    await pressOk(0);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("continues without an alert when the training does not qualify", async () => {
    const onContinue = jest.fn();
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("BAS", [], kneePain, { onContinue });
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("marks the pain alert as seen on OK", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue: jest.fn(),
      });
    });
    await pressOk(0);

    expect(useUserProfileStore.getState().warnings.painAlertSeen).toBe(true);
  });

  it("skips the alert on the next training once acknowledged", async () => {
    const onContinue = jest.fn();
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue: jest.fn(),
      });
    });
    await pressOk(0);
    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue,
      });
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("shows the alert again once the seen flag was reset", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue: jest.fn(),
      });
    });
    await pressOk(0);
    useUserProfileStore.getState().setWarningSeen("painAlertSeen", false);
    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue: jest.fn(),
      });
    });

    expect(Alert.alert).toHaveBeenCalledTimes(2);
  });

  it("makes the pain alert cancelable", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue: jest.fn(),
        onCancel: jest.fn(),
      });
    });

    const [, , , options] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(options).toEqual(
      expect.objectContaining({
        cancelable: true,
        onDismiss: expect.any(Function),
      }),
    );
  });

  it("calls onCancel and not onContinue when the pain alert is dismissed", async () => {
    const onContinue = jest.fn();
    const onCancel = jest.fn();
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue,
        onCancel,
      });
    });
    const [, , , options] = (Alert.alert as jest.Mock).mock.calls[0];
    await act(() => {
      options?.onDismiss?.();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("keeps the seen flag unset when the pain alert is dismissed", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowPainAlert("TEST_WORKOUT", [], kneePain, {
        onContinue: jest.fn(),
        onCancel: jest.fn(),
      });
    });
    const [, , , options] = (Alert.alert as jest.Mock).mock.calls[0];
    await act(() => {
      options?.onDismiss?.();
    });

    expect(useUserProfileStore.getState().warnings.painAlertSeen).toBe(false);
  });
});

describe("useTrainingAlerts: maybeShowBarbellAlert", () => {
  it("shows the barbell alert for a TEST_WORKOUT whose next exercise carries barbell equipment", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
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

  it("does not show the barbell alert for a non TEST_WORKOUT training type", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowBarbellAlert({ tags: ["EQ_BARBELL"] }, "PLAN");
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("does not show the barbell alert when the next exercise has no barbell equipment", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_DUMBBELL"] },
        "TEST_WORKOUT",
      );
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("one shot: suppresses the barbell alert after acknowledging it once", async () => {
    const { result } = await renderHook(() => useTrainingAlerts());

    await act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_BARBELL"] },
        "TEST_WORKOUT",
      );
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    await act(() => {
      buttons[0].onPress();
    });

    await act(() => {
      result.current.maybeShowBarbellAlert(
        { tags: ["EQ_BARBELL"] },
        "TEST_WORKOUT",
      );
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});

import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useTrainingAlerts } from "./useTrainingAlerts";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const seedWorkoutTags = (hasPain: boolean) => {
  useUserWorkoutStore.setState({
    workoutData: {
      sport: "OTHER_SPORT",
      tags: {
        POSITION: ["FIELD"],
        LEVEL: ["BEGINNER"],
        ...(hasPain ? { PAIN: ["KNEE"] } : {}),
      },
      seasonPhase: { type: null, endDate: "2026-01-01" },
      maxValues: DEFAULT_MAX_VALUES,
    },
  });
};

beforeEach(() => {
  jest.spyOn(Alert, "alert");
  seedWorkoutTags(false);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useTrainingAlerts: maybeShowPainAlert", () => {
  it("shows the pain alert when the next exercise is weightFMax and the user has PAIN tags", () => {
    seedWorkoutTags(true);
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowPainAlert({ weightType: "weightFMax" });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "training.active.strengthTestAlert.title",
      "training.active.strengthTestAlert.message",
      expect.any(Array),
    );
  });

  it("does not show the pain alert when the user has no PAIN tags", () => {
    seedWorkoutTags(false);
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowPainAlert({ weightType: "weightFMax" });
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("does not show the pain alert when the next exercise is not weightFMax", () => {
    seedWorkoutTags(true);
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowPainAlert({ weightType: "weightAbsolute" });
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("one shot: suppresses the pain alert after acknowledging it once", () => {
    seedWorkoutTags(true);
    const { result } = renderHook(() => useTrainingAlerts());

    act(() => {
      result.current.maybeShowPainAlert({ weightType: "weightFMax" });
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => {
      buttons[0].onPress();
    });

    act(() => {
      result.current.maybeShowPainAlert({ weightType: "weightFMax" });
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
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

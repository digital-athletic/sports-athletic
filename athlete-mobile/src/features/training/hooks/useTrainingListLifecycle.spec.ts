import { Alert } from "@/common/Alert";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { Logger } from "@/services/Logger";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingListLifecycle } from "./useTrainingListLifecycle";

const mockDismissTo = jest.fn();
const mockUsePreventRemove = jest.fn();
let mockOnHardwareBack: (() => void) | undefined;

jest.mock("@/features/training/hooks/useTrainingScreenLifecycle", () => ({
  useTrainingScreenLifecycle: ({ onAbort }: { onAbort: () => void }) => {
    mockOnHardwareBack = onAbort;
    return { isScreenFocused: true };
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ dismissTo: mockDismissTo }),
  usePreventRemove: (prevent: boolean, callback: () => void) =>
    mockUsePreventRemove(prevent, callback),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
const logEventSpy = jest.spyOn(Logger, "logEvent").mockResolvedValue();

const pressAlertButton = async (text: string) => {
  const buttons = alertSpy.mock.calls[0]?.[2];
  await act(() => {
    buttons?.find((b) => b.text === text)?.onPress?.();
  });
};

describe("useTrainingListLifecycle: discard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      activeTraining: { id: "workout-1", type: "PLAN" },
      time: { ...BASELINE_TRAINING_STATE.time, start: 1000 },
      trainingViewMode: "LIST",
      exerciseList: [createExercise({ exerciseId: "1", completed: true })],
    });
  });

  it("discards the session and returns to the overview when the athlete confirms", async () => {
    const { result } = await renderHook(() =>
      useTrainingListLifecycle({ isEnding: false }),
    );

    await act(() => {
      result.current.handleDiscard();
    });
    await pressAlertButton("common.yes");

    const state = useTrainingStore.getState();
    expect(state.time.start).toBeUndefined();
    expect(state.trainingViewMode).toBeNull();
    expect(state.exerciseList?.[0]?.completed).toBeUndefined();
    expect(logEventSpy).toHaveBeenCalledWith("training_discarded", {
      type: "PLAN",
    });
    expect(logEventSpy).not.toHaveBeenCalledWith(
      "training_aborted",
      expect.anything(),
    );
    expect(mockDismissTo).toHaveBeenCalledWith("/training/training-overview");
    expect(mockUsePreventRemove).toHaveBeenLastCalledWith(
      false,
      expect.any(Function),
    );
  });

  it("keeps the session when the athlete cancels", async () => {
    const { result } = await renderHook(() =>
      useTrainingListLifecycle({ isEnding: false }),
    );

    await act(() => {
      result.current.handleDiscard();
    });
    await pressAlertButton("common.no");

    const state = useTrainingStore.getState();
    expect(state.time.start).toBe(1000);
    expect(state.exerciseList?.[0]?.completed).toBe(true);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("asks to discard on the Android hardware back", async () => {
    await renderHook(() => useTrainingListLifecycle({ isEnding: false }));

    await act(() => {
      mockOnHardwareBack?.();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "training.list.discard.question",
      "training.list.discard.explanation",
      expect.any(Array),
    );
  });

  it("stops preventing removal once the training is ending", async () => {
    await renderHook(() => useTrainingListLifecycle({ isEnding: true }));

    expect(mockUsePreventRemove).toHaveBeenLastCalledWith(
      false,
      expect.any(Function),
    );
  });
});

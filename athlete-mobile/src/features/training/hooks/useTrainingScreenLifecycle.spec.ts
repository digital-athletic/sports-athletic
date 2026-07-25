import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE as BASELINE } from "@/features/training/utils/testFixtures";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { act, renderHook } from "@testing-library/react-native";
import { BackHandler } from "react-native";
import { useTrainingScreenLifecycle } from "./useTrainingScreenLifecycle";

jest.mock("expo-keep-awake", () => ({
  useKeepAwake: jest.fn(),
}));

jest.mock("@/features/training/utils/trainingEventUtils", () => ({
  logTrainingEvent: jest.fn(),
}));

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      useEffect(effect, [effect]);
    },
  };
});

const mockLogTrainingEvent = logTrainingEvent as jest.Mock;
const mockAddEventListener = jest
  .spyOn(BackHandler, "addEventListener")
  .mockReturnValue({ remove: jest.fn() });

describe("useTrainingScreenLifecycle: hardware back handling", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockLogTrainingEvent.mockClear();
    mockAddEventListener.mockClear();
  });

  it("invokes onAbort and returns true when the hardware back button is pressed", () => {
    const onAbort = jest.fn();

    renderHook(() => useTrainingScreenLifecycle({ onAbort }));

    const backPressHandler = mockAddEventListener.mock.calls.find(
      ([eventName]) => eventName === "hardwareBackPress",
    )?.[1];

    expect(backPressHandler).toBeDefined();

    let handledResult: boolean | null | undefined;
    act(() => {
      handledResult = backPressHandler?.();
    });

    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(handledResult).toBe(true);
  });
});

describe("useTrainingScreenLifecycle: training started logging", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockLogTrainingEvent.mockClear();
    mockAddEventListener.mockClear();
  });

  it("logs training_started once for the active training", () => {
    useTrainingStore.setState({
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    renderHook(() => useTrainingScreenLifecycle({ onAbort: jest.fn() }));

    expect(mockLogTrainingEvent).toHaveBeenCalledTimes(1);
    expect(mockLogTrainingEvent).toHaveBeenCalledWith(
      { id: "training-1", type: "PLAN" },
      "training_started",
    );
  });
});

describe("useTrainingScreenLifecycle: screen focus tracking", () => {
  beforeEach(() => {
    useTrainingStore.setState(BASELINE);
    mockLogTrainingEvent.mockClear();
    mockAddEventListener.mockClear();
  });

  it("reports the screen as focused once mounted", () => {
    const { result } = renderHook(() =>
      useTrainingScreenLifecycle({ onAbort: jest.fn() }),
    );

    expect(result.current.isScreenFocused).toBe(true);
  });
});

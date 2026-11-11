import { Alert } from "@/common/Alert";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { Logger } from "@/services/Logger";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingListLifecycle } from "./useTrainingListLifecycle";

const mockDismissTo = jest.fn();
const mockReplace = jest.fn();
const mockParentGoBack = jest.fn();
let mockParentCanGoBack = true;
let mockStackRoutes: { name: string; params?: { category?: string } }[] = [];
const mockUsePreventRemove = jest.fn();
let mockOnHardwareBack: (() => void) | undefined;

jest.mock("@/features/training/hooks/useTrainingScreenLifecycle", () => ({
  useTrainingScreenLifecycle: ({ onAbort }: { onAbort: () => void }) => {
    mockOnHardwareBack = onAbort;
    return { isScreenFocused: true };
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ dismissTo: mockDismissTo, replace: mockReplace }),
  useNavigation: () => ({
    getState: () => ({ routes: mockStackRoutes }),
    getParent: () => ({
      goBack: mockParentGoBack,
      canGoBack: () => mockParentCanGoBack,
    }),
  }),
  useLocalSearchParams: () => ({ weekday: "2", place: "STUDIO" }),
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

// A started checklist session without exercises, e.g.
// { activeTraining: { id: "workout-1", type: "PLAN" }, time.start: 1000, trainingViewMode: "LIST" }.
const startListTraining = () => {
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
  useTrainingStore.setState({
    activeTraining: { id: "workout-1", type: "PLAN" },
    time: { ...BASELINE_TRAINING_STATE.time, start: 1000 },
    trainingViewMode: "LIST",
  });
};

describe("useTrainingListLifecycle: back before a completed set", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startListTraining();
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true, skipped: true }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID, completed: true }),
        createExercise({ exerciseId: "2" }),
      ],
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
    expect(mockDismissTo).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: "/training/training-overview",
      params: { weekday: "2", place: "STUDIO" },
    });
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

describe("useTrainingListLifecycle: back after a completed set", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParentCanGoBack = true;
    mockStackRoutes = [{ name: "training-list" }];
    startListTraining();
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: "2" }),
      ],
    });
  });

  it("asks to abort the training", async () => {
    const { result } = await renderHook(() =>
      useTrainingListLifecycle({ isEnding: false }),
    );

    await act(() => {
      result.current.handleDiscard();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "training.active.abort.question",
      "training.active.abort.explanation",
      expect.any(Array),
    );
  });

  it("clears the training when the athlete confirms", async () => {
    const { result } = await renderHook(() =>
      useTrainingListLifecycle({ isEnding: false }),
    );

    await act(() => {
      result.current.handleDiscard();
    });
    await pressAlertButton("common.yes");

    const state = useTrainingStore.getState();
    expect(state.exerciseList).toBeNull();
    expect(state.activeTraining).toBeNull();
    expect(logEventSpy).toHaveBeenCalledWith("training_discarded", {
      type: "PLAN",
    });
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

    expect(useTrainingStore.getState().exerciseList?.[0]?.completed).toBe(true);
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});

describe("useTrainingListLifecycle: where an abort returns to", () => {
  const confirmAbort = async () => {
    const { result, rerender } = await renderHook(() =>
      useTrainingListLifecycle({ isEnding: false }),
    );
    await act(() => {
      result.current.handleDiscard();
    });
    await pressAlertButton("common.yes");
    return { rerender };
  };

  const dispatchCount = () =>
    mockDismissTo.mock.calls.length +
    mockParentGoBack.mock.calls.length +
    mockReplace.mock.calls.length;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParentCanGoBack = true;
    mockStackRoutes = [{ name: "training-list" }];
    startListTraining();
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: "2" }),
      ],
    });
  });

  it.each(["plan", "focus", "prevention"])(
    "dismisses to the %s selection when the stack contains it",
    async (category) => {
      mockStackRoutes = [
        { name: "new", params: { category } },
        { name: "muscle-soreness" },
        { name: "training-overview" },
        { name: "training-list" },
      ];

      await confirmAbort();

      expect(mockDismissTo).toHaveBeenCalledTimes(1);
      expect(mockDismissTo).toHaveBeenCalledWith({
        pathname: "/training/new",
        params: { category },
      });
      expect(mockParentGoBack).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it("goes back on the parent navigator for a custom workout opened from a list", async () => {
    mockStackRoutes = [
      { name: "muscle-soreness" },
      { name: "training-overview" },
      { name: "training-list" },
    ];

    await confirmAbort();

    expect(mockParentGoBack).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("replaces with Home for a resumed checklist with no screen below", async () => {
    mockStackRoutes = [{ name: "training-list" }];
    mockParentCanGoBack = false;

    await confirmAbort();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockParentGoBack).not.toHaveBeenCalled();
  });

  it("dispatches exactly once even when the screen renders again", async () => {
    mockStackRoutes = [
      { name: "new", params: { category: "plan" } },
      { name: "training-list" },
    ];

    const { rerender } = await confirmAbort();
    await rerender({});
    await rerender({});

    expect(dispatchCount()).toBe(1);
  });

  it.each([
    {
      name: "the selection",
      routes: [{ name: "new", params: { category: "plan" } }],
      canGoBack: true,
    },
    {
      name: "the origin",
      routes: [{ name: "muscle-soreness" }],
      canGoBack: true,
    },
    { name: "Home", routes: [{ name: "training-list" }], canGoBack: false },
  ])(
    "clears the training before it returns to $name",
    async ({ routes, canGoBack }) => {
      mockStackRoutes = [...routes, { name: "training-list" }];
      mockParentCanGoBack = canGoBack;
      const activeTrainingAtDispatch: unknown[] = [];
      const recordActiveTraining = () => {
        activeTrainingAtDispatch.push(
          useTrainingStore.getState().activeTraining,
        );
      };
      mockDismissTo.mockImplementation(recordActiveTraining);
      mockParentGoBack.mockImplementation(recordActiveTraining);
      mockReplace.mockImplementation(recordActiveTraining);

      await confirmAbort();

      expect(activeTrainingAtDispatch).toEqual([null]);
    },
  );
});

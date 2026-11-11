import { Alert } from "@/common/Alert";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { useTrainingListScreen } from "./useTrainingListScreen";

const mockFinishTraining = jest.fn();

jest.mock("@/features/training/hooks/useFinishTraining", () => ({
  useFinishTraining: () => ({ finishTraining: mockFinishTraining }),
}));

jest.mock("@/features/training/hooks/useTrainingScreenLifecycle", () => ({
  useTrainingScreenLifecycle: () => ({ isScreenFocused: true }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), dismissTo: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useNavigation: jest.fn(),
  usePreventRemove: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("useTrainingListScreen: finishing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID, duration: 60 }),
        createExercise({ exerciseId: "2", completed: true }),
      ],
    });
  });

  it("marks every rest row completed without skipping before the finish runs", async () => {
    let restRowsAtFinish: unknown;
    mockFinishTraining.mockImplementation(() => {
      restRowsAtFinish = useTrainingStore
        .getState()
        .exerciseList?.filter((e) => e.exerciseId === PAUSE_EXERCISE_ID)
        .map((e) => ({ skipped: e.skipped, completed: e.completed }));
    });
    const { result } = await renderHook(() => useTrainingListScreen());

    await act(() => {
      result.current.handleFinish();
    });

    expect(restRowsAtFinish).toEqual([{ skipped: undefined, completed: true }]);
  });

  it("finishes without a confirmation when every set is done", async () => {
    const { result } = await renderHook(() => useTrainingListScreen());

    await act(() => {
      result.current.handleFinish();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockFinishTraining).toHaveBeenCalledWith(false, null);
  });

  it("ends the training as aborted after the athlete confirms finishing with open sets", async () => {
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", completed: true }),
        createExercise({ exerciseId: "2" }),
      ],
    });
    mockFinishTraining.mockReturnValue(true);
    const { result } = await renderHook(() => useTrainingListScreen());

    await act(() => {
      result.current.handleFinish();
    });
    expect(mockFinishTraining).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]?.[2];
    await act(() => {
      buttons?.find((b) => b.text === "common.yes")?.onPress?.();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "training.list.finishEarly.question",
      "training.list.finishEarly.explanation",
      expect.any(Array),
    );
    expect(mockFinishTraining).toHaveBeenCalledWith(true);
    expect(result.current.isFinishing).toBe(true);
  });
});

describe("useTrainingListScreen: the featured exercise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1" }),
        createExercise({ exerciseId: "2" }),
        createExercise({ exerciseId: "3" }),
      ],
    });
  });

  it("features the first exercise before any set is finished", async () => {
    const { result } = await renderHook(() => useTrainingListScreen());

    expect(result.current.featuredEntryKey).toBe(0);
  });

  it("features the exercise after the one completed out of order", async () => {
    const { result } = await renderHook(() => useTrainingListScreen());

    await act(() => {
      result.current.handleStart(result.current.blocks[1].entries[0]);
    });
    await act(() => {
      result.current.sheetProps.onComplete();
    });

    expect(result.current.featuredEntryKey).toBe(2);
  });

  it("features the first open exercise again after the last one is completed", async () => {
    const { result } = await renderHook(() => useTrainingListScreen());

    await act(() => {
      result.current.handleStart(result.current.blocks[2].entries[0]);
    });
    await act(() => {
      result.current.sheetProps.onComplete();
    });

    expect(result.current.featuredEntryKey).toBe(0);
  });
});

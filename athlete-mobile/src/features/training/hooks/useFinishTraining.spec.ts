import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { Logger } from "@/services/Logger";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "@/common/Alert";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useFinishTraining } from "./useFinishTraining";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.spyOn(Alert, "alert").mockImplementation(() => {});
jest.spyOn(Logger, "logEvent").mockResolvedValue();
jest.spyOn(Logger, "logError").mockResolvedValue();

// A started checklist session, e.g.
// { activeTraining: { id: "workout-1", type: "PLAN" }, time.start: 1000, time.end: undefined }.
const startTraining = () => {
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
  useTrainingStore.setState({
    activeTraining: { id: "workout-1", type: "PLAN" },
    time: { ...BASELINE_TRAINING_STATE.time, start: 1000 },
    trainingViewMode: "LIST",
  });
};

describe("useFinishTraining: navigating to the success screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startTraining();
  });

  it("pushes the success screen and returns true", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    let returned: unknown;
    await act(() => {
      returned = result.current.finishTraining(false);
    });

    expect(returned).toBe(true);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training/training-success",
      params: { aborted: "false" },
    });
    expect(useTrainingStore.getState().time.end).toBeDefined();
  });
});

describe("useFinishTraining: the push to the success screen throws", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startTraining();
    mockPush.mockImplementationOnce(() => {
      throw new Error("navigation failed");
    });
  });

  it("returns false", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    let returned: unknown;
    await act(() => {
      returned = result.current.finishTraining(false);
    });

    expect(returned).toBe(false);
  });

  it("resets the end time so the session stays resumable", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining(false);
    });

    expect(useTrainingStore.getState().time.end).toBeUndefined();
  });

  it("can be called again and then reaches the success screen", async () => {
    const { result } = await renderHook(() => useFinishTraining());
    await act(() => {
      result.current.finishTraining(false);
    });

    let returned: unknown;
    await act(() => {
      returned = result.current.finishTraining(false);
    });

    expect(returned).toBe(true);
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("stores the test result of a strength test once when the retry succeeds", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "workout-1", type: "TEST_WORKOUT" },
    });
    const resultsBefore =
      useExerciseProgressStore.getState().testHistory.length;
    const { result } = await renderHook(() => useFinishTraining());
    const maxValues = useUserWorkoutStore.getState().workoutData.maxValues;

    await act(() => {
      result.current.finishTraining(false, maxValues);
    });
    await act(() => {
      result.current.finishTraining(false, maxValues);
    });

    expect(useExerciseProgressStore.getState().testHistory).toHaveLength(
      resultsBefore + 1,
    );
  });
});

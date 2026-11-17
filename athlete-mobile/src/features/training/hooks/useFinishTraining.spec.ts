import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { Logger } from "@/services/Logger";
import { act, renderHook } from "@testing-library/react-native";
import { Alert } from "@/common/Alert";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { generateSportTest } from "@test/factories/sportTest";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import {
  ALL_SPORTS_CACHE_KEY,
  useSportTestsStore,
} from "@/store/sportTestsStore";
import { useUserProfileStore } from "@/store/userProfileStore";
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
      returned = result.current.finishTraining("finished");
    });

    expect(returned).toBe(true);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training/training-success",
      params: { outcome: "finished" },
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
      returned = result.current.finishTraining("finished");
    });

    expect(returned).toBe(false);
  });

  it("resets the end time so the session stays resumable", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining("finished");
    });

    expect(useTrainingStore.getState().time.end).toBeUndefined();
  });

  it("can be called again and then reaches the success screen", async () => {
    const { result } = await renderHook(() => useFinishTraining());
    await act(() => {
      result.current.finishTraining("finished");
    });

    let returned: unknown;
    await act(() => {
      returned = result.current.finishTraining("finished");
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
      result.current.finishTraining("finished", maxValues);
    });
    await act(() => {
      result.current.finishTraining("finished", maxValues);
    });

    expect(useExerciseProgressStore.getState().testHistory).toHaveLength(
      resultsBefore + 1,
    );
  });
});

describe("useFinishTraining: finishing a training early", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startTraining();
  });

  it("tells the success screen that the training was finished early", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining("finishedEarly");
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training/training-success",
      params: { outcome: "finishedEarly" },
    });
  });

  it("stores no test result for a strength test finished early", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "workout-1", type: "TEST_WORKOUT" },
    });
    const resultsBefore =
      useExerciseProgressStore.getState().testHistory.length;
    const maxValues = useUserWorkoutStore.getState().workoutData.maxValues;
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining("finishedEarly", maxValues);
    });

    expect(useExerciseProgressStore.getState().testHistory).toHaveLength(
      resultsBefore,
    );
  });
});

/** A strength test result of 2026-11-10 with a squat of 84 kg, e.g. kneeDominant: { barbell: 84 }. */
const generateSquatResult = () => ({
  ...DEFAULT_MAX_VALUES,
  testAt: new Date(2026, 10, 10, 12).getTime(),
  kneeDominant: { barbell: 84 },
});

describe("useFinishTraining: performance test values of a strength test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startTraining();
    useTrainingStore.setState({
      activeTraining: { id: "workout-1", type: "TEST_WORKOUT" },
    });
    usePerformanceTestValuesStore.setState({ values: [] });
    useSportTestsStore.setState({
      testsBySport: { [ALL_SPORTS_CACHE_KEY]: [generateSportTest("SQUAT")] },
    });
    useUserProfileStore.getState().setWeight(70);
    useUserWorkoutStore.getState().setSport("SPORT_HANDBALL");
  });

  it("adds the squat value after storing the finished strength test", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining("finished", generateSquatResult());
    });

    expect(usePerformanceTestValuesStore.getState().values).toEqual([
      expect.objectContaining({
        testCode: "SQUAT",
        date: "2026-11-10",
        value: 1.2,
      }),
    ]);
  });

  it("still stores the strength test and returns true when adding the values fails", async () => {
    const originalAddValue = usePerformanceTestValuesStore.getState().addValue;
    usePerformanceTestValuesStore.setState({
      addValue: () => {
        throw new Error("storage full");
      },
    });
    const resultsBefore =
      useExerciseProgressStore.getState().testHistory.length;
    const { result } = await renderHook(() => useFinishTraining());

    let returned: unknown;
    await act(() => {
      returned = result.current.finishTraining(
        "finished",
        generateSquatResult(),
      );
    });

    expect(returned).toBe(true);
    expect(useExerciseProgressStore.getState().testHistory).toHaveLength(
      resultsBefore + 1,
    );
    usePerformanceTestValuesStore.setState({ addValue: originalAddValue });
  });

  it("adds no value for a strength test finished early", async () => {
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining("finishedEarly", generateSquatResult());
    });

    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });

  it("adds no value for another training", async () => {
    useTrainingStore.setState({
      activeTraining: { id: "workout-1", type: "PLAN" },
    });
    const { result } = await renderHook(() => useFinishTraining());

    await act(() => {
      result.current.finishTraining("finished", generateSquatResult());
    });

    expect(usePerformanceTestValuesStore.getState().values).toEqual([]);
  });
});

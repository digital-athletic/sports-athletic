import TrainingSuccessScreen from "../../../app/training/training-success";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { act, fireEvent, render } from "../../utils/testUtils";
import { BackHandler, Platform } from "react-native";

const mockReplace = jest.fn();
let mockSearchParams: { aborted?: string } = {};

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    Stack: { Screen: () => null },
    useRouter: () => ({ replace: mockReplace }),
    useLocalSearchParams: () => mockSearchParams,
    useFocusEffect: (effect: () => void | (() => void)) => {
      useEffect(effect, [effect]);
    },
  };
});

const mockAddEventListener = jest
  .spyOn(BackHandler, "addEventListener")
  .mockReturnValue({ remove: jest.fn() });

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/charts/RadarChart", () => ({ RadarChart: () => null }));
jest.mock("@/features/statistics/components/PowerTest", () => ({
  PowerTest: () => null,
}));

describe("TrainingSuccessScreen: aborted training", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { aborted: "true" };
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ completed: true, set: [1, 1], repetition: 10 }),
      ],
      time: {
        ...BASELINE_TRAINING_STATE.time,
        start: 1_000,
        end: 601_000,
      },
    });
    useCompletedWorkoutsStore.getState().clearWorkoutHistory();
    useExerciseProgressStore.setState({ xp: 0 });
  });

  it("awards no XP, stores no workout and goes Home on Continue", async () => {
    const { getByText } = await render(<TrainingSuccessScreen />);

    await act(() => {
      fireEvent.press(getByText("Go on"));
    });

    expect(useExerciseProgressStore.getState().xp).toBe(0);
    expect(useCompletedWorkoutsStore.getState().workoutsList).toEqual([]);
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
  });
});

describe("TrainingSuccessScreen: workout view", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      time: {
        ...BASELINE_TRAINING_STATE.time,
        start: 1_000,
        end: 601_000,
      },
    });
    useCompletedWorkoutsStore.getState().clearWorkoutHistory();
  });

  it.each(["LIST", "SEQUENTIAL"] as const)(
    "stores a finished workout started in the %s view with that view",
    async (viewMode) => {
      useTrainingStore.setState({
        trainingViewMode: viewMode,
        exerciseList: [
          createExercise({ completed: true, set: [1, 1], repetition: 10 }),
        ],
      });

      await render(<TrainingSuccessScreen />);

      const workouts = Object.values(
        useCompletedWorkoutsStore.getState().workouts,
      );
      expect(workouts).toHaveLength(1);
      expect(workouts[0].viewMode).toBe(viewMode);
    },
  );
});

describe("TrainingSuccessScreen: summary cards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ completed: true, set: [1, 1], repetition: 10 }),
      ],
      time: {
        ...BASELINE_TRAINING_STATE.time,
        start: 1_000,
        end: 601_000,
      },
    });
    useCompletedWorkoutsStore.getState().clearWorkoutHistory();
  });

  it("shows the exercise count of the finished workout in its own card", async () => {
    const { getByTestId, getByLabelText } = await render(
      <TrainingSuccessScreen />,
    );

    expect(getByTestId("training-success-summary-count")).toHaveTextContent(
      "1",
    );
    expect(getByLabelText("Exercises: 1")).toBeTruthy();
    expect(getByLabelText(/^Duration: /)).toBeTruthy();
  });
});

describe("TrainingSuccessScreen: leaving the screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    Platform.OS = "android";
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      activeTraining: { id: "workout-1", type: "PLAN" },
      exerciseList: [
        createExercise({ completed: true, set: [1, 1], repetition: 10 }),
      ],
      time: {
        ...BASELINE_TRAINING_STATE.time,
        start: 1_000,
        end: 601_000,
      },
    });
    useCompletedWorkoutsStore.getState().clearWorkoutHistory();
  });

  it("clears the session and goes Home on Continue", async () => {
    const { getByText } = await render(<TrainingSuccessScreen />);

    await act(() => {
      fireEvent.press(getByText("Go on"));
    });

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
    expect(useTrainingStore.getState().exerciseList).toBeNull();
    expect(useTrainingStore.getState().activeTraining).toBeNull();
  });

  it("keeps showing the summary after Continue cleared the session", async () => {
    const { getByText, queryByText, getByTestId } = await render(
      <TrainingSuccessScreen />,
    );

    await act(() => {
      fireEvent.press(getByText("Go on"));
    });

    expect(getByTestId("training-success-summary")).toBeTruthy();
    expect(queryByText(/did not record all of your training data/)).toBeNull();
  });

  it("keeps showing the summary when Home clears the session while the screen leaves", async () => {
    const { queryByText, getByTestId } = await render(
      <TrainingSuccessScreen />,
    );

    await act(() => {
      useTrainingStore.getState().clearTraining();
    });

    expect(getByTestId("training-success-summary")).toBeTruthy();
    expect(queryByText(/did not record all of your training data/)).toBeNull();
  });

  it("goes Home on the Android hardware back like Continue", async () => {
    await render(<TrainingSuccessScreen />);
    const onHardwareBack = mockAddEventListener.mock.calls.find(
      ([eventName]) => eventName === "hardwareBackPress",
    )?.[1];

    let handled: boolean | null | undefined;
    await act(() => {
      handled = onHardwareBack?.({ type: "hardwareBackPress", timeStamp: 0 });
    });

    expect(handled).toBe(true);
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
  });
});

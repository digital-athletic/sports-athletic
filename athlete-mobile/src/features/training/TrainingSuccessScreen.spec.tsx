import TrainingSuccessScreen from "../../../app/training/training-success";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { act, fireEvent, render } from "../../utils/testUtils";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ aborted: "true" }),
}));

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

  it("awards no XP, stores no workout and clears the session on Continue", async () => {
    const { getByText } = await render(<TrainingSuccessScreen />);

    await act(() => {
      fireEvent.press(getByText("Go on"));
    });

    expect(useExerciseProgressStore.getState().xp).toBe(0);
    expect(useCompletedWorkoutsStore.getState().workoutsList).toEqual([]);
    expect(useTrainingStore.getState().exerciseList).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
  });
});

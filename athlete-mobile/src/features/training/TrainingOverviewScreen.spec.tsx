import { useTrainingStore } from "@/features/training/trainingStore";
import { fireEvent, render, screen } from "@/utils/testUtils";
import TrainingOverviewScreen from "../../../app/training/training-overview";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ type: "PLAN" }),
  // The screen never regains focus in these tests.
  useFocusEffect: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockSetTrainingStartTime = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useTrainingStore.setState({
    exerciseList: [],
    setTrainingStartTime: mockSetTrainingStartTime,
  });
});

describe("TrainingOverviewScreen: start training", () => {
  it("pushes the active training route once for two presses", async () => {
    await render(<TrainingOverviewScreen />);
    const button = screen.getByRole("button", { name: "Start training" });

    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/training/training-active" }),
    );
  });

  it("sets the training start time once for two presses", async () => {
    await render(<TrainingOverviewScreen />);
    const button = screen.getByRole("button", { name: "Start training" });

    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(mockSetTrainingStartTime).toHaveBeenCalledTimes(1);
  });
});

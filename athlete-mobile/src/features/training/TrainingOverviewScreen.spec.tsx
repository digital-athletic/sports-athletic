import { useTrainingStore } from "@/features/training/trainingStore";
import { fireEvent, render, screen } from "@/utils/testUtils";
import { type ReactNode } from "react";
import TrainingOverviewScreen from "../../../app/training/training-overview";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  // Renders the header button so the tests reach it like the athlete does.
  Stack: {
    Screen: (props: { options: { headerRight?: () => ReactNode } }) =>
      props.options.headerRight?.() ?? null,
  },
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

  it("pushes the training list route once for two presses on the checklist button", async () => {
    await render(<TrainingOverviewScreen />);
    const button = screen.getByRole("button", {
      name: "Start without guidance",
    });

    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/training/training-list" }),
    );
  });
});

describe("TrainingOverviewScreen: share", () => {
  const SHARE_LABEL = "Share the workout as text";

  it("shows the share button in the header", async () => {
    await render(<TrainingOverviewScreen />);

    expect(screen.getByRole("button", { name: SHARE_LABEL })).toBeOnTheScreen();
  });

  it("hides the share button while the workout is loading", async () => {
    useTrainingStore.setState({ exerciseList: null });

    await render(<TrainingOverviewScreen />);

    expect(
      screen.queryByRole("button", { name: SHARE_LABEL }),
    ).not.toBeOnTheScreen();
  });
});

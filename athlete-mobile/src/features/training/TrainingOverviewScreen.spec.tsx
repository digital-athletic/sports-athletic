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

// Renders the stopwatch icon as a host node named after it, so the tests read
// which placeholder icon the overview draws.
jest.mock("@tabler/icons-react-native/IconStopwatch", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconStopwatch", props),
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

describe("TrainingOverviewScreen: exercise picture placeholder", () => {
  // Exercise 25 has a picture file, exercise 1204 has none.
  const WITH_PICTURE_ID = "25";
  const WITHOUT_PICTURE_ID = "1204";

  beforeEach(() => {
    useTrainingStore.setState({
      exerciseList: [
        {
          exerciseId: WITH_PICTURE_ID,
          skill: "GKS",
          set: [1, 2],
          repetition: 10,
        },
        {
          exerciseId: WITHOUT_PICTURE_ID,
          skill: "GKS",
          set: [2, 2],
          duration: 30,
        },
      ],
    });
  });

  it("shows the placeholder without a picture for an exercise without a picture", async () => {
    await render(<TrainingOverviewScreen />);

    expect(
      screen.getByTestId(
        `training-overview-exercise-${WITHOUT_PICTURE_ID}-picture-placeholder`,
        { includeHiddenElements: true },
      ),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId(
        `training-overview-exercise-${WITHOUT_PICTURE_ID}-picture`,
        { includeHiddenElements: true },
      ),
    ).not.toBeOnTheScreen();
  });

  it("draws the stopwatch icon in the placeholder of a timed exercise", async () => {
    await render(<TrainingOverviewScreen />);

    const placeholder = screen.getByTestId(
      `training-overview-exercise-${WITHOUT_PICTURE_ID}-picture-placeholder`,
      { includeHiddenElements: true },
    );
    expect(
      placeholder.queryAll((node) => node.type === "IconStopwatch"),
    ).toHaveLength(1);
  });

  it("draws the exercise picture over the placeholder while it loads", async () => {
    await render(<TrainingOverviewScreen />);

    expect(
      screen.getByTestId(
        `training-overview-exercise-${WITH_PICTURE_ID}-picture-placeholder`,
        { includeHiddenElements: true },
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId(
        `training-overview-exercise-${WITH_PICTURE_ID}-picture`,
        {
          includeHiddenElements: true,
        },
      ),
    ).toBeOnTheScreen();
  });

  it("keeps the placeholder and drops the picture after the picture fails to load", async () => {
    await render(<TrainingOverviewScreen />);
    const picture = screen.getByTestId(
      `training-overview-exercise-${WITH_PICTURE_ID}-picture`,
      { includeHiddenElements: true },
    );

    await fireEvent(picture, "error", {
      nativeEvent: { error: "The picture request failed" },
    });

    expect(
      screen.queryByTestId(
        `training-overview-exercise-${WITH_PICTURE_ID}-picture`,
        { includeHiddenElements: true },
      ),
    ).not.toBeOnTheScreen();
    expect(
      screen.getByTestId(
        `training-overview-exercise-${WITH_PICTURE_ID}-picture-placeholder`,
        { includeHiddenElements: true },
      ),
    ).toBeOnTheScreen();
  });
});

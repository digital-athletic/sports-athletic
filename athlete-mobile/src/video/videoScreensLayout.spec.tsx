import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { type TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { render, screen, within } from "@/utils/testUtils";
import { Dimensions } from "react-native";
import SectionDetailsScreen from "../../app/(tabs)/(home)/section-details";
import ExerciseInformationScreen from "../../app/training/exercise-information";
import TrainingActive from "../../app/training/training-active";

const mockPlayer = {
  replaceAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock("expo-video", () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: () => null,
}));
jest.mock("expo", () => ({
  ...jest.requireActual("expo"),
  useEvent: () => ({ isPlaying: false }),
}));
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { back: jest.fn() },
  useRouter: () => ({ navigate: jest.fn(), replace: jest.fn() }),
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ exerciseId: "1", activeSection: "0" }),
}));
jest.mock("@/features/training/hooks/useVoiceCoach", () => ({
  useVoiceCoach: jest.fn(),
}));
jest.mock("react-native-keyboard-controller", () => ({
  KeyboardAwareScrollView: jest.requireActual("react-native").ScrollView,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const tabletLandscape = { width: 1280, height: 800, scale: 2, fontScale: 2 };
const tabletPortrait = { width: 800, height: 1280, scale: 2, fontScale: 2 };

// A plan with one section, for example:
// { start: "2026-01-05", sections: [{ type: "SK", numOfWeeks: 4, ... }] }
const generateTrainingPlan = (): TrainingPlanType => ({
  start: "2026-01-05",
  sections: [
    {
      start: "2026-01-05",
      numOfWeeks: 4,
      type: "SK",
      cardioType: "CARDIO_1",
      trainings: [],
    },
  ],
});

describe("video screens: tablet in landscape", () => {
  beforeEach(() => {
    Dimensions.set({ window: tabletLandscape, screen: tabletLandscape });
  });

  it("training active shows the player and the content in two columns", async () => {
    useTrainingStore.setState({
      ...BASELINE_TRAINING_STATE,
      exerciseList: [createExercise({ exerciseId: "1", duration: 30 })],
    });

    await render(<TrainingActive />);

    expect(screen.getByTestId("video-frame")).toHaveStyle({
      position: "absolute",
    });
    expect(
      within(screen.getByTestId("tall-landscape-column-second")).getByLabelText(
        "Pause",
      ),
    ).toBeTruthy();
  });

  it("exercise information shows the player and the text in two columns", async () => {
    await render(<ExerciseInformationScreen />);

    expect(screen.getByTestId("video-frame")).toHaveStyle({
      position: "absolute",
    });
    expect(
      within(screen.getByTestId("tall-landscape-column-second")).getByText(
        "Muscles trained",
      ),
    ).toBeTruthy();
  });

  it("section details shows the 16:9 video left and the back button right", async () => {
    useUserWorkoutStore.setState({ trainingPlan: generateTrainingPlan() });

    await render(<SectionDetailsScreen />);

    const firstColumn = screen.getByTestId("tall-landscape-column-first");
    expect(within(firstColumn).getByTestId("video-frame")).toHaveStyle({
      aspectRatio: 16 / 9,
    });
    expect(
      within(screen.getByTestId("tall-landscape-column-second")).getByText(
        "Back",
      ),
    ).toBeTruthy();
  });
});

describe("video screens: tablet in portrait", () => {
  beforeEach(() => {
    Dimensions.set({ window: tabletPortrait, screen: tabletPortrait });
  });

  it("exercise information keeps the 16:9 box above the text", async () => {
    await render(<ExerciseInformationScreen />);

    expect(screen.getByTestId("video-frame")).toHaveStyle({
      aspectRatio: 16 / 9,
    });
    expect(screen.getByTestId("tall-landscape-columns")).toHaveStyle({
      flexDirection: "column",
    });
  });
});

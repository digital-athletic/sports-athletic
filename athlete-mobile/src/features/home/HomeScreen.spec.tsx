import HomeScreen from "../../../app/(tabs)/(home)/index";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { fireEvent, render } from "@/utils/testUtils";
import { generateLayoutEvent } from "@test/factories/layoutEvent";
import { Dimensions } from "react-native";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { push: jest.fn(), replace: jest.fn() },
  useFocusEffect: jest.fn(),
}));

jest.mock("expo-router/react-navigation", () => ({
  useHeaderHeight: () => 0,
}));

const START_TRAINING = "Start Training";
const EMPTY_PLAN_TEXT = "You have no training phases right now";
const FOCUS_SUBTITLE =
  "Targeted trainings for stability, mobility and prevention";

beforeEach(() => {
  useUserProfileStore.setState({ anamnesisCompleted: true });
  useUserWorkoutStore.setState({
    trainingPlan: { start: "2026-10-05", sections: [] } as TrainingPlanType,
  });
});

describe("HomeScreen: layout by window size", () => {
  it.each([
    {
      name: "a phone in landscape",
      width: 800,
      height: 411,
      content: "row",
      shortcuts: "column",
      planTexts: [START_TRAINING, EMPTY_PLAN_TEXT],
    },
    {
      name: "a tablet in landscape",
      width: 1280,
      height: 800,
      content: "column",
      shortcuts: "row",
      planTexts: [EMPTY_PLAN_TEXT, START_TRAINING],
    },
    {
      name: "a phone in portrait",
      width: 411,
      height: 800,
      content: "column",
      shortcuts: "row",
      planTexts: [EMPTY_PLAN_TEXT, START_TRAINING],
    },
    {
      name: "a tablet in portrait",
      width: 800,
      height: 1280,
      content: "column",
      shortcuts: "row",
      planTexts: [EMPTY_PLAN_TEXT, START_TRAINING],
    },
  ] as const)(
    "arranges the plan and the shortcuts for $name",
    async ({ width, height, content, shortcuts, planTexts }) => {
      const size = { width, height, scale: 2, fontScale: 2 };
      Dimensions.set({ window: size, screen: size });

      const { getAllByText, getByTestId } = await render(<HomeScreen />);

      expect(getByTestId("home-content")).toHaveStyle({
        flexDirection: content,
      });
      expect(getByTestId("home-shortcuts")).toHaveStyle({
        flexDirection: shortcuts,
      });
      const renderedPlanTexts = getAllByText(
        new RegExp(`${START_TRAINING}|${EMPTY_PLAN_TEXT}`),
      ).map((node) => node.props.children);
      expect(renderedPlanTexts).toEqual(planTexts);
    },
  );
});

describe("HomeScreen: content taller than the screen", () => {
  it("keeps the shortcut subtitles on a small phone in portrait", async () => {
    // iPhone SE: 375 x 667 points.
    const size = { width: 375, height: 667, scale: 2, fontScale: 1 };
    Dimensions.set({ window: size, screen: size });

    const { getByTestId, getByText } = await render(<HomeScreen />);
    const scrollView = getByTestId("home-scroll");
    await fireEvent(scrollView, "layout", generateLayoutEvent(375, 300));
    await fireEvent(scrollView, "contentSizeChange", 375, 400);

    expect(getByText(FOCUS_SUBTITLE)).toBeTruthy();
  });
});

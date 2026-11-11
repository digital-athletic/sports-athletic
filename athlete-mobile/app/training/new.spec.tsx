import { render, fireEvent } from "@/utils/testUtils";
import { BackHandler, Platform } from "react-native";
import NewTraining from "./new";

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockCategory: string | undefined;

jest.mock("expo-router", () => {
  const { createElement } = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return {
    router: {
      back: () => mockBack(),
      replace: (href: string) => mockReplace(href),
      canGoBack: () => mockCanGoBack,
    },
    useLocalSearchParams: () => ({ category: mockCategory }),
    Stack: { Screen: () => null },
    Redirect: ({ href }: { href: string }) =>
      createElement(Text, { testID: "redirect" }, href),
  };
});

jest.mock("@/features/training/PlanDayScreen", () => {
  const { createElement } = jest.requireActual("react");
  const { Pressable } = jest.requireActual("react-native");
  return {
    PlanDayScreen: ({ onBack }: { onBack: () => void }) =>
      createElement(Pressable, { testID: "plan-day-screen", onPress: onBack }),
  };
});

jest.mock("@/features/training/FocusTrainingGrid", () => {
  const { createElement } = jest.requireActual("react");
  const { Pressable } = jest.requireActual("react-native");
  return {
    FocusTrainingGrid: ({ onBack }: { onBack: () => void }) =>
      createElement(Pressable, {
        testID: "focus-training-grid",
        onPress: onBack,
      }),
  };
});

jest.mock("@/features/training/PreventionBodyPartScreen", () => {
  const { createElement } = jest.requireActual("react");
  const { Pressable } = jest.requireActual("react-native");
  return {
    PreventionBodyPartScreen: ({ onBack }: { onBack: () => void }) =>
      createElement(Pressable, {
        testID: "prevention-body-part-screen",
        onPress: onBack,
      }),
  };
});

jest.mock("@/features/training/hooks/useTrainingGapCheck", () => ({
  useTrainingGapCheck: jest.fn(),
}));

const addEventListenerSpy = jest.spyOn(BackHandler, "addEventListener");

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack = true;
  mockCategory = undefined;
  Platform.OS = "android";
});

describe("NewTraining: screen per category", () => {
  it("shows the plan days for the plan category", async () => {
    mockCategory = "plan";

    const { getByTestId, queryByTestId } = await render(<NewTraining />);

    expect(getByTestId("plan-day-screen")).toBeTruthy();
    expect(queryByTestId("focus-training-grid")).toBeNull();
    expect(queryByTestId("prevention-body-part-screen")).toBeNull();
  });

  it("shows the focus grid for the focus category", async () => {
    mockCategory = "focus";

    const { getByTestId, queryByTestId } = await render(<NewTraining />);

    expect(getByTestId("focus-training-grid")).toBeTruthy();
    expect(queryByTestId("plan-day-screen")).toBeNull();
    expect(queryByTestId("prevention-body-part-screen")).toBeNull();
  });

  it("shows the body parts for the prevention category", async () => {
    mockCategory = "prevention";

    const { getByTestId, queryByTestId } = await render(<NewTraining />);

    expect(getByTestId("prevention-body-part-screen")).toBeTruthy();
    expect(queryByTestId("plan-day-screen")).toBeNull();
    expect(queryByTestId("focus-training-grid")).toBeNull();
  });
});

describe("NewTraining: invalid category", () => {
  it("redirects to Home when the category is missing", async () => {
    mockCategory = undefined;

    const { getByTestId } = await render(<NewTraining />);

    expect(getByTestId("redirect").props.children).toBe("/(tabs)/(home)");
  });

  it("redirects to Home when the category is unknown", async () => {
    mockCategory = "strength";

    const { getByTestId } = await render(<NewTraining />);

    expect(getByTestId("redirect").props.children).toBe("/(tabs)/(home)");
  });
});

describe("NewTraining: back", () => {
  it.each([
    { category: "plan", testID: "plan-day-screen" },
    { category: "focus", testID: "focus-training-grid" },
    { category: "prevention", testID: "prevention-body-part-screen" },
  ])(
    "goes back one screen from the $category selection when there is history",
    async ({ category, testID }) => {
      mockCategory = category;
      mockCanGoBack = true;
      const { getByTestId } = await render(<NewTraining />);

      await fireEvent.press(getByTestId(testID));

      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it("replaces with Home when there is no history", async () => {
    mockCategory = "plan";
    mockCanGoBack = false;
    const { getByTestId } = await render(<NewTraining />);

    await fireEvent.press(getByTestId("plan-day-screen"));

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)/(home)");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("registers no hardware back handler so the default pop applies", async () => {
    mockCategory = "plan";

    await render(<NewTraining />);

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );
  });
});

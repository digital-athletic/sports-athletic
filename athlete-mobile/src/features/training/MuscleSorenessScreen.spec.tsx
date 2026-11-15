import { render } from "@/utils/testUtils";
import { act } from "@testing-library/react-native";
import { BackHandler, Platform } from "react-native";
import MuscleSorenessScreen from "../../../app/training/muscle-soreness";

// Holds the latest focus effect, so a test decides when the screen is focused or blurred.
let mockFocusEffect: (() => void | (() => void)) | undefined;
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ type: "PLAN" }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    mockFocusEffect = effect;
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/bodyParts/MuscleSorenessSelector", () => ({
  MuscleSorenessSelector: () => null,
}));

jest.mock("@/features/training/hooks/useTrainingGeneration", () => ({
  checksSoreness: () => true,
  useTrainingGeneration: () => ({
    generating: false,
    generateTraining: jest.fn(),
  }),
}));

const mockAddEventListener = jest.spyOn(BackHandler, "addEventListener");

beforeEach(() => {
  mockFocusEffect = undefined;
  Platform.OS = "android";
  mockAddEventListener.mockReset();
  mockAddEventListener.mockReturnValue({ remove: jest.fn() });
});

describe("MuscleSorenessScreen: hardware back", () => {
  it("does not register the back listener while the screen is not focused", async () => {
    await render(<MuscleSorenessScreen />);

    expect(mockAddEventListener).not.toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );
  });

  it("registers the back listener when the screen gets focus", async () => {
    await render(<MuscleSorenessScreen />);

    await act(() => {
      mockFocusEffect?.();
    });

    expect(mockAddEventListener).toHaveBeenCalledWith(
      "hardwareBackPress",
      expect.any(Function),
    );
  });

  it("removes the back listener when the screen loses focus", async () => {
    const remove = jest.fn();
    mockAddEventListener.mockReturnValue({ remove });
    await render(<MuscleSorenessScreen />);

    const cleanup = mockFocusEffect?.();
    await act(() => {
      if (typeof cleanup === "function") cleanup();
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });
});

import i18n from "@/i18n";
import { act, fireEvent, render, screen } from "@/utils/testUtils";
import { FocusTrainingGrid } from "./FocusTrainingGrid";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

describe("FocusTrainingGrid: content", () => {
  it("shows the eyebrow, the headline and all six trainings in order", async () => {
    await render(<FocusTrainingGrid title="Focus Training" />);

    expect(screen.getByText("Focus training · 10-20 min")).toBeTruthy();
    expect(
      screen.getByRole("header", { name: "What do you want to train?" }),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("button")
        .map((tile) => tile.props.accessibilityLabel),
    ).toEqual([
      "Leg Axis Stability, Build stability in your lower body",
      "Full Body Stability, Strengthen your entire body",
      "Mobility, Improve your range of motion",
      "Foam Roller, Self-massage and foam rolling",
      "Warm-up, Prepare your body for training",
      "Cool Down, Recovery and stretching",
    ]);
  });

  it("reads the eyebrow and the headline in german", async () => {
    await act(() => i18n.changeLanguage("de"));

    await render(<FocusTrainingGrid title="Fokus-Training" />);

    expect(screen.getByText("Fokus-Training · 10-20 Min")).toBeTruthy();
    expect(
      screen.getByRole("header", { name: "Was möchtest du trainieren?" }),
    ).toBeTruthy();
  });
});

describe("FocusTrainingGrid: navigation", () => {
  it("opens the muscle soreness step of the mobility training", async () => {
    await render(<FocusTrainingGrid title="Focus Training" />);

    fireEvent.press(
      screen.getByRole("button", {
        name: "Mobility, Improve your range of motion",
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: "MOB" },
    });
  });
});

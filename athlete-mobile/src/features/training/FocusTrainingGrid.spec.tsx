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
  it("shows the eyebrow, the headline and all eight trainings in order", async () => {
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
      "Athletic Warm-up, Approx. 10 to 15 min",
      "Athletic Warm-up, Approx. 20 to 25 min",
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

describe("FocusTrainingGrid: athletic warm-ups", () => {
  it("reads the athletic warm-ups in German", async () => {
    await act(() => i18n.changeLanguage("de"));

    await render(<FocusTrainingGrid title="Fokus-Training" />);

    expect(
      screen.getByRole("button", {
        name: "Athletik Warm-up, ca. 10 bis 15 Min.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Athletik Warm-up, ca. 20 bis 25 Min.",
      }),
    ).toBeTruthy();
  });

  it("shows the rocket icon on both athletic warm-ups", async () => {
    await render(<FocusTrainingGrid title="Focus Training" />);

    expect(
      screen.getByTestId("athletic-warmup-short-tile-icon", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(
      screen.getByTestId("athletic-warmup-long-tile-icon", {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });

  it.each([
    ["Athletic Warm-up, Approx. 10 to 15 min", "ATHLETIK_WARMUP_10_15"],
    ["Athletic Warm-up, Approx. 20 to 25 min", "ATHLETIK_WARMUP_20_25"],
  ])("opens the muscle soreness step for %s", async (name, type) => {
    await render(<FocusTrainingGrid title="Focus Training" />);

    fireEvent.press(screen.getByRole("button", { name }));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type },
    });
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

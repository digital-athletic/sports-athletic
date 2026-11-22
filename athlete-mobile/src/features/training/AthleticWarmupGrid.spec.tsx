import i18n from "@/i18n";
import { act, fireEvent, render, screen } from "@/utils/testUtils";
import { AthleticWarmupGrid } from "./AthleticWarmupGrid";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const SHORT_LABEL = "10 to 15 min, Compact warm-up before your sport";
const LONG_LABEL =
  "20 to 25 min, Extended warm-up with more stability and jumps";

beforeEach(() => {
  mockNavigate.mockClear();
});

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

describe("AthleticWarmupGrid: content", () => {
  it("shows the eyebrow, the headline and both warm-ups in order", async () => {
    await render(<AthleticWarmupGrid title="Athletic Warm-up" />);

    expect(screen.getByText("Athletic warm-up · 10 to 25 min")).toBeTruthy();
    expect(
      screen.getByRole("header", { name: "How much time do you have?" }),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("button")
        .map((tile) => tile.props.accessibilityLabel),
    ).toEqual([SHORT_LABEL, LONG_LABEL]);
  });

  it("reads the warm-ups in German", async () => {
    await act(() => i18n.changeLanguage("de"));

    await render(<AthleticWarmupGrid title="Athletik Warm-up" />);

    expect(screen.getByText("Athletik Warm-up · 10 bis 25 Min.")).toBeTruthy();
    expect(
      screen.getByRole("header", { name: "Wie viel Zeit hast du?" }),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("button")
        .map((tile) => tile.props.accessibilityLabel),
    ).toEqual([
      "10 bis 15 Min., Kompaktes Warm-up vor deinem Training",
      "20 bis 25 Min., Erweitertes Warm-up mit mehr Stabilität und Sprüngen",
    ]);
  });

  it("shows the rocket icon on both tiles", async () => {
    await render(<AthleticWarmupGrid title="Athletic Warm-up" />);

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
});

describe("AthleticWarmupGrid: navigation", () => {
  it.each([
    [SHORT_LABEL, "ATHLETIK_WARMUP_10_15"],
    [LONG_LABEL, "ATHLETIK_WARMUP_20_25"],
  ])("opens the muscle soreness step for %s", async (label, type) => {
    await render(<AthleticWarmupGrid title="Athletic Warm-up" />);

    fireEvent.press(screen.getByRole("button", { name: label }));

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type },
    });
  });
});

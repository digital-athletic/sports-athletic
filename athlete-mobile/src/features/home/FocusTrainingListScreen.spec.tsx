import i18n from "@/i18n";
import { act, fireEvent, render, within } from "@/utils/testUtils";
import FocusTrainingListScreen from "./FocusTrainingListScreen";

const mockPush = jest.fn();
const mockStackScreen = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useRouter: () => ({ back: jest.fn() }),
  Stack: {
    Screen: (props: { options: { title?: string } }) => {
      mockStackScreen(props);
      return null;
    },
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const FOCUS_LABEL = "Focus-Trainings, 10-20 minutes topic specific training";
const PREVENTION_LABEL = "Imminent Pains, Specifically improve imminent pains";

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
});

describe("FocusTrainingListScreen: headline", () => {
  it("sets the focus and prevention screen title", async () => {
    await render(<FocusTrainingListScreen />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Focus & Prevention" }),
      }),
    );
  });

  it("shows the headline as a header", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    expect(getByRole("header", { name: "Focus & Prevention" })).toBeTruthy();
  });

  it("shows the subtitle in English", async () => {
    const { getByText } = await render(<FocusTrainingListScreen />);

    expect(
      getByText("Short trainings next to your plan. Pick what you need today."),
    ).toBeTruthy();
  });

  it("shows the subtitle in German", async () => {
    await act(() => i18n.changeLanguage("de"));
    const { getByText } = await render(<FocusTrainingListScreen />);

    expect(
      getByText(
        "Kurze Trainings neben deinem Plan. Wähle, was du heute brauchst.",
      ),
    ).toBeTruthy();
  });
});

describe("FocusTrainingListScreen: tiles", () => {
  it("shows the focus tile with its title and description", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    expect(getByRole("button", { name: FOCUS_LABEL })).toBeTruthy();
  });

  it("shows the prevention tile with its title and description", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    expect(getByRole("button", { name: PREVENTION_LABEL })).toBeTruthy();
  });

  it("shows only the two tiles as buttons", async () => {
    const { getAllByRole } = await render(<FocusTrainingListScreen />);

    expect(getAllByRole("button")).toHaveLength(2);
  });

  it("places both tiles in the tile grid", async () => {
    const { getByTestId } = await render(<FocusTrainingListScreen />);

    const grid = getByTestId("focus-prevention-grid");
    expect(
      within(grid).getByRole("button", { name: FOCUS_LABEL }),
    ).toBeTruthy();
    expect(
      within(grid).getByRole("button", { name: PREVENTION_LABEL }),
    ).toBeTruthy();
  });
});

describe("FocusTrainingListScreen: starting a training", () => {
  it("opens the focus selection through the route category", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    await fireEvent.press(getByRole("button", { name: FOCUS_LABEL }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training/new",
      params: { category: "focus" },
    });
  });

  it("opens the prevention selection through the route category", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    await fireEvent.press(getByRole("button", { name: PREVENTION_LABEL }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training/new",
      params: { category: "prevention" },
    });
  });
});

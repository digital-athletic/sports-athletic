import { fireEvent, render } from "@/utils/testUtils";
import FocusTrainingListScreen from "./FocusTrainingListScreen";

const mockPush = jest.fn();
const mockStackScreen = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Stack: {
    Screen: (props: { options: { title?: string } }) => {
      mockStackScreen(props);
      return null;
    },
  },
}));

const mockSetTrainingSelection = jest.fn();
jest.mock("@/features/training/trainingStore", () => {
  const state = {
    setTrainingSelection: (selection: string | null) =>
      mockSetTrainingSelection(selection),
  };
  return {
    useTrainingStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

const FOCUS_TITLE = "Focus-Trainings";
const PREVENTION_TITLE = "Imminent Pains";
const FOCUS_LABEL = `${FOCUS_TITLE}, 10-20 minutes topic specific training`;
const PREVENTION_LABEL = `${PREVENTION_TITLE}, Specifically improve imminent pains`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FocusTrainingListScreen: entries", () => {
  it("sets the focus and prevention header title", async () => {
    await render(<FocusTrainingListScreen />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Focus & Prevention" }),
      }),
    );
  });

  it("shows the focus training entry with its subtitle", async () => {
    const { getByText } = await render(<FocusTrainingListScreen />);

    expect(getByText(FOCUS_TITLE)).toBeTruthy();
    expect(getByText("10-20 minutes topic specific training")).toBeTruthy();
  });

  it("shows the prevention training entry with its subtitle", async () => {
    const { getByText } = await render(<FocusTrainingListScreen />);

    expect(getByText(PREVENTION_TITLE)).toBeTruthy();
    expect(getByText("Specifically improve imminent pains")).toBeTruthy();
  });

  it("exposes both entries as buttons", async () => {
    const { getAllByRole } = await render(<FocusTrainingListScreen />);

    expect(getAllByRole("button")).toHaveLength(2);
  });
});

describe("FocusTrainingListScreen: starting a training", () => {
  it("selects QUICK when the focus entry is pressed", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    fireEvent.press(getByRole("button", { name: FOCUS_LABEL }));

    expect(mockSetTrainingSelection).toHaveBeenCalledTimes(1);
    expect(mockSetTrainingSelection).toHaveBeenCalledWith("QUICK");
  });

  it("pushes /training with type QUICK when the focus entry is pressed", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    fireEvent.press(getByRole("button", { name: FOCUS_LABEL }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training",
      params: { type: "QUICK" },
    });
  });

  it("selects PREV when the prevention entry is pressed", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    fireEvent.press(getByRole("button", { name: PREVENTION_LABEL }));

    expect(mockSetTrainingSelection).toHaveBeenCalledTimes(1);
    expect(mockSetTrainingSelection).toHaveBeenCalledWith("PREV");
  });

  it("pushes /training with type PREV when the prevention entry is pressed", async () => {
    const { getByRole } = await render(<FocusTrainingListScreen />);

    fireEvent.press(getByRole("button", { name: PREVENTION_LABEL }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/training",
      params: { type: "PREV" },
    });
  });
});

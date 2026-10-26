import { fireEvent, render } from "@/utils/testUtils";
import { HomeTrainingShortcuts } from "./HomeTrainingShortcuts";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const FOCUS_LABEL = "Focus & Prevention";
const ADDITIONAL_LABEL = "Additional trainings";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("HomeTrainingShortcuts: rendering", () => {
  it("renders the focus and prevention button with title and subtitle", async () => {
    const { getByRole, getByText } = await render(
      <HomeTrainingShortcuts isLandscape={false} />,
    );

    expect(getByText("Focus & Prevention")).toBeTruthy();
    expect(
      getByText("Targeted trainings for stability, mobility and prevention"),
    ).toBeTruthy();
    expect(getByRole("button", { name: FOCUS_LABEL })).toBeTruthy();
  });

  it("renders the additional trainings button with title and subtitle", async () => {
    const { getByRole, getByText } = await render(
      <HomeTrainingShortcuts isLandscape={false} />,
    );

    expect(getByText("Additional trainings")).toBeTruthy();
    expect(
      getByText("My trainings or trainings created by the coaching team"),
    ).toBeTruthy();
    expect(getByRole("button", { name: ADDITIONAL_LABEL })).toBeTruthy();
  });
});

describe("HomeTrainingShortcuts: navigation", () => {
  it("pushes /focus-trainings when the focus and prevention button is pressed", async () => {
    const { getByRole } = await render(
      <HomeTrainingShortcuts isLandscape={false} />,
    );

    fireEvent.press(getByRole("button", { name: FOCUS_LABEL }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/focus-trainings");
  });

  it("pushes /additional-trainings when the additional trainings button is pressed", async () => {
    const { getByRole } = await render(
      <HomeTrainingShortcuts isLandscape={false} />,
    );

    fireEvent.press(getByRole("button", { name: ADDITIONAL_LABEL }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/additional-trainings");
  });
});

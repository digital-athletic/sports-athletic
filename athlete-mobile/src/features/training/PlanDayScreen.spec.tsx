import { type TileData } from "@/constants/workoutConstants";
import { fireEvent, render, screen, within } from "@/utils/testUtils";
import { PlanDayScreen } from "./PlanDayScreen";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

/** Plan day tile, e.g. Monday (weekday 1) opening the muscle soreness step. */
const generatePlanDayTile = (
  title: TileData["title"],
  weekday: number,
): TileData => ({
  title,
  navigate: {
    key: "/training/muscle-soreness",
    params: { type: "PLAN", weekday },
  },
});

const DAYS = [
  generatePlanDayTile("screens.trainingDays.mondayTraining", 1),
  generatePlanDayTile("screens.trainingDays.wednesdayTraining", 3),
  generatePlanDayTile("screens.trainingDays.fridayTraining", 5),
];

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("PlanDayScreen: training days", () => {
  it("shows each training day as a tile in the tile grid", async () => {
    await render(
      <PlanDayScreen title="Start training" days={DAYS} onBack={jest.fn()} />,
    );

    const grid = screen.getByTestId("plan-days");
    expect(
      within(grid).getByRole("button", { name: "Monday workout" }),
    ).toBeTruthy();
    expect(
      within(grid).getByRole("button", { name: "Wednesday workout" }),
    ).toBeTruthy();
    expect(
      within(grid).getByRole("button", { name: "Friday workout" }),
    ).toBeTruthy();
  });

  it("opens the training day of the tapped tile", async () => {
    await render(
      <PlanDayScreen title="Start training" days={DAYS} onBack={jest.fn()} />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Wednesday workout" }),
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: "PLAN", weekday: 3 },
    });
  });
});

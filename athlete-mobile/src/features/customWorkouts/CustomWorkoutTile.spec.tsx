import { fireEvent, render } from "@/utils/testUtils";
import { CustomWorkoutTile } from "./CustomWorkoutTile";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  router: { navigate: (...args: unknown[]) => mockNavigate(...args) },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CustomWorkoutTile: refresh button", () => {
  it("shows no refresh button without a refresh action", async () => {
    const { queryByRole } = await render(
      <CustomWorkoutTile
        workoutId="custom-a"
        name="My core"
        focus="stability"
      />,
    );

    expect(queryByRole("button", { name: /^Refresh / })).toBeNull();
  });

  it("shows the refresh button alone on a tile without a delete action", async () => {
    const { getByRole, queryByRole } = await render(
      <CustomWorkoutTile
        workoutId="custom-a"
        name="Team core"
        focus="stability"
        refreshAction={{ label: "Refresh Team core", onRefresh: jest.fn() }}
      />,
    );

    expect(getByRole("button", { name: "Refresh Team core" })).toBeTruthy();
    expect(queryByRole("button", { name: /^Delete / })).toBeNull();
  });

  it("shows the refresh button next to the delete button", async () => {
    const { getAllByRole } = await render(
      <CustomWorkoutTile
        workoutId="custom-a"
        name="My core"
        focus="stability"
        refreshAction={{ label: "Refresh My core", onRefresh: jest.fn() }}
        deleteAction={{ label: "Delete My core", onDelete: jest.fn() }}
      />,
    );

    expect(
      getAllByRole("button").map((button) => button.props.accessibilityLabel),
    ).toEqual(["My core", "Refresh My core", "Delete My core"]);
  });

  it("calls onRefresh once and leaves the workout closed when the refresh button is pressed", async () => {
    const onRefresh = jest.fn();
    const { getByRole } = await render(
      <CustomWorkoutTile
        workoutId="custom-a"
        name="My core"
        focus="stability"
        refreshAction={{ label: "Refresh My core", onRefresh }}
      />,
    );

    await fireEvent.press(getByRole("button", { name: "Refresh My core" }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the workout without calling onRefresh when the tile is pressed", async () => {
    const onRefresh = jest.fn();
    const { getByRole } = await render(
      <CustomWorkoutTile
        workoutId="custom-a"
        name="My core"
        focus="stability"
        refreshAction={{ label: "Refresh My core", onRefresh }}
      />,
    );

    await fireEvent.press(getByRole("button", { name: "My core" }));

    expect(onRefresh).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/training/muscle-soreness",
      params: { type: "custom-a" },
    });
  });
});

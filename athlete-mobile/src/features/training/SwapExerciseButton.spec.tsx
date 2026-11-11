import { fireEvent } from "@testing-library/react-native";
import { render } from "../../utils/testUtils";
import { SwapControlsContext, SwapExerciseButton } from "./SwapExerciseButton";

describe("SwapExerciseButton: swap an exercise", () => {
  it("shows no button without swap controls", async () => {
    const { queryByRole } = await render(
      <SwapExerciseButton branchId="10" exerciseName="Squat" />,
    );

    expect(queryByRole("button")).toBeNull();
  });

  it("shows no button for a branch without alternatives", async () => {
    const { queryByRole } = await render(
      <SwapControlsContext value={{ canSwap: () => false, onSwap: jest.fn() }}>
        <SwapExerciseButton branchId="10" exerciseName="Squat" />
      </SwapControlsContext>,
    );

    expect(queryByRole("button")).toBeNull();
  });

  it("swaps the branch of the named exercise on a tap", async () => {
    const onSwap = jest.fn();
    const { getByRole } = await render(
      <SwapControlsContext value={{ canSwap: () => true, onSwap }}>
        <SwapExerciseButton branchId="10" exerciseName="Squat" />
      </SwapControlsContext>,
    );

    fireEvent.press(getByRole("button", { name: "Swap exercise Squat" }));

    expect(onSwap).toHaveBeenCalledWith("10");
  });
});

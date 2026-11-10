import { fireEvent } from "@testing-library/react-native";
import { render } from "../../utils/testUtils";
import {
  SwapControlsContext,
  SwapExerciseButton,
  SwapExerciseSlot,
} from "./SwapExerciseButton";

describe("SwapExerciseButton: swap an exercise", () => {
  it("names the button after the exercise it swaps", async () => {
    const { getByRole } = await render(
      <SwapExerciseButton exerciseName="Squat" onPress={jest.fn()} />,
    );

    expect(getByRole("button", { name: "Swap exercise Squat" })).toBeTruthy();
  });

  it("calls onPress on a tap", async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <SwapExerciseButton exerciseName="Squat" onPress={onPress} />,
    );

    fireEvent.press(getByRole("button", { name: "Swap exercise Squat" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("SwapExerciseSlot: swap controls of the overview", () => {
  it("shows no button without swap controls", async () => {
    const { queryByRole } = await render(
      <SwapExerciseSlot branchId="10" exerciseName="Squat" />,
    );

    expect(queryByRole("button")).toBeNull();
  });

  it("shows no button for a branch without alternatives", async () => {
    const { queryByRole } = await render(
      <SwapControlsContext value={{ canSwap: () => false, onSwap: jest.fn() }}>
        <SwapExerciseSlot branchId="10" exerciseName="Squat" />
      </SwapControlsContext>,
    );

    expect(queryByRole("button")).toBeNull();
  });

  it("swaps the branch of the exercise on a tap", async () => {
    const onSwap = jest.fn();
    const { getByRole } = await render(
      <SwapControlsContext value={{ canSwap: () => true, onSwap }}>
        <SwapExerciseSlot branchId="10" exerciseName="Squat" />
      </SwapControlsContext>,
    );

    fireEvent.press(getByRole("button", { name: "Swap exercise Squat" }));

    expect(onSwap).toHaveBeenCalledWith("10");
  });
});

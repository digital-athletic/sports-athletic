import { fireEvent } from "@testing-library/react-native";
import { render } from "../../utils/testUtils";
import { SwapExerciseButton } from "./SwapExerciseButton";

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

import { fireEvent, render, screen } from "@/utils/testUtils";
import { AddTileCard } from "./AddTileCard";

describe("AddTileCard", () => {
  it("announces a button with the label", async () => {
    await render(<AddTileCard label="Generate training" onPress={jest.fn()} />);

    expect(
      screen.getByRole("button", { name: "Generate training" }),
    ).toBeTruthy();
  });

  it("shows the label", async () => {
    await render(<AddTileCard label="Generate training" onPress={jest.fn()} />);

    expect(screen.getByText("Generate training")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(
      <AddTileCard label="Generate training" onPress={onPress} testID="add" />,
    );

    await fireEvent.press(screen.getByTestId("add"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

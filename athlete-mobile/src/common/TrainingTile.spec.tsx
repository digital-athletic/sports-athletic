import { fireEvent, render, screen } from "@/utils/testUtils";
import { TrainingTile } from "./TrainingTile";

describe("TrainingTile: screen reader", () => {
  it("announces a button with title and description", async () => {
    await render(
      <TrainingTile
        title="Focus trainings"
        description="Ten minutes on one topic"
        iconName="add"
        size="full"
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Focus trainings, Ten minutes on one topic",
      }),
    ).toBeTruthy();
  });

  it("announces only the title without a description", async () => {
    await render(
      <TrainingTile
        title="Imminent pains"
        iconName="add"
        size="half"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Imminent pains" })).toBeTruthy();
  });
});

describe("TrainingTile: content", () => {
  it("shows title and description on a photo", async () => {
    await render(
      <TrainingTile
        title="Focus trainings"
        description="Ten minutes on one topic"
        image={{ uri: "https://example.com/focus.jpg" }}
        size="full"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Focus trainings")).toBeTruthy();
    expect(screen.getByText("Ten minutes on one topic")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(
      <TrainingTile
        title="Imminent pains"
        iconName="add"
        size="full"
        onPress={onPress}
        testID="pain-tile"
      />,
    );

    fireEvent.press(screen.getByTestId("pain-tile"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from "@/utils/testUtils";
import { ChoiceCards } from "./ChoiceCards";

const options = [
  { value: "HOME", label: "Home", description: "Train in your living room" },
  { value: "STUDIO", label: "Gym" },
];

describe("ChoiceCards: single choice", () => {
  it("marks only the card of the current value as checked", async () => {
    await render(
      <ChoiceCards
        accessibilityLabel="Place"
        options={options}
        value="STUDIO"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Gym" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Home" })).not.toBeChecked();
  });

  it("shows the description of an option", async () => {
    await render(
      <ChoiceCards
        accessibilityLabel="Place"
        options={options}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Train in your living room")).toBeTruthy();
  });

  it("reports the value of the pressed card", async () => {
    const onChange = jest.fn();
    await render(
      <ChoiceCards
        accessibilityLabel="Place"
        options={options}
        value="STUDIO"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "Home" }));

    expect(onChange).toHaveBeenCalledWith("HOME");
  });
});

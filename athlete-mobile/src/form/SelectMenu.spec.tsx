import { fireEvent, render, screen } from "@/utils/testUtils";
import { SelectMenu } from "./SelectMenu";

const options = [
  { value: "", label: "All" },
  { value: "SPEED", label: "Speed" },
  { value: "ENDURANCE", label: "Endurance" },
] as const;

describe("SelectMenu: native menu", () => {
  it("shows the label of the current value on the trigger", async () => {
    await render(
      <SelectMenu
        accessibilityLabel="Filter by category"
        options={options}
        value="SPEED"
        onChange={jest.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Filter by category" });
    expect(trigger).toHaveAccessibilityValue({ text: "Speed" });
  });

  it("checks only the action of the current value", async () => {
    await render(
      <SelectMenu
        accessibilityLabel="Filter by category"
        options={options}
        value="SPEED"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Speed" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "All" })).not.toBeChecked();
  });

  it("reports the value of the chosen option, also an empty value", async () => {
    const onChange = jest.fn();
    await render(
      <SelectMenu
        accessibilityLabel="Filter by category"
        options={options}
        value="SPEED"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "Endurance" }));
    await fireEvent.press(screen.getByRole("radio", { name: "All" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "ENDURANCE");
    expect(onChange).toHaveBeenNthCalledWith(2, "");
  });
});

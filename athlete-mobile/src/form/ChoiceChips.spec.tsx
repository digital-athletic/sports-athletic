import { fireEvent, render, screen, within } from "@/utils/testUtils";
import { ChoiceChips } from "./ChoiceChips";

const options = [
  { value: "week", label: "Week", accessibilityLabel: "Last week" },
  { value: "total", label: "Total" },
];

describe("ChoiceChips: accessible names", () => {
  it("shows the short label and reads the accessibility label", async () => {
    await render(
      <ChoiceChips
        accessibilityLabel="Time range"
        options={options}
        value="total"
        onChange={jest.fn()}
      />,
    );

    const week = screen.getByRole("radio", { name: "Last week" });
    expect(within(week).getByText("Week")).toBeTruthy();
    expect(screen.queryByText("Last week")).toBeNull();
  });

  it("falls back to the visible label as the accessible name", async () => {
    await render(
      <ChoiceChips
        accessibilityLabel="Time range"
        options={options}
        value="total"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Total" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Last week" })).not.toBeChecked();
  });

  it("reports the value of the pressed compact chip", async () => {
    const onChange = jest.fn();
    await render(
      <ChoiceChips
        accessibilityLabel="Time range"
        options={options}
        value="total"
        onChange={onChange}
        size="compact"
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "Last week" }));

    expect(onChange).toHaveBeenCalledWith("week");
  });
});

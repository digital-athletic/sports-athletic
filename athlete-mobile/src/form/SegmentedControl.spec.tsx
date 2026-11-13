import { fireEvent, render, screen } from "@/utils/testUtils";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "workouts", label: "Training" },
  { value: "tests", label: "Power test" },
] as const;

describe("SegmentedControl: native control", () => {
  it("marks only the segment of the current value as selected", async () => {
    await render(
      <SegmentedControl
        accessibilityLabel="View"
        options={options}
        value="tests"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Power test" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "Training" })).not.toBeSelected();
  });

  it("reports the value of the pressed segment, not its label", async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        accessibilityLabel="View"
        options={options}
        value="workouts"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole("tab", { name: "Power test" }));

    expect(onChange).toHaveBeenCalledWith("tests");
  });
});

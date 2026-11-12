import { fireEvent, render, screen } from "@/utils/testUtils";
import { SegmentedControl } from "./SegmentedControl.web";

const options = [
  { value: "workouts", label: "Training", testID: "segment-workouts" },
  { value: "tests", label: "Power test", testID: "segment-tests" },
] as const;

describe("SegmentedControl: pill toggle", () => {
  it("groups the segments in a labelled tab list", async () => {
    await render(
      <SegmentedControl
        accessibilityLabel="View"
        options={options}
        value="workouts"
        onChange={jest.fn()}
      />,
    );

    // The tab list stays non accessible so that its tabs remain focusable on iOS.
    expect(screen.getByLabelText("View")).toHaveProp(
      "accessibilityRole",
      "tablist",
    );
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

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

  it("reports the value of the pressed segment", async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        accessibilityLabel="View"
        options={options}
        value="workouts"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByTestId("segment-tests"));

    expect(onChange).toHaveBeenCalledWith("tests");
  });
});

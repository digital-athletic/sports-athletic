import { theme } from "../theme/theme";
import { fireEvent, render } from "../utils/testUtils";

import { SnapSliderInputField } from "./SnapSliderInputField";

// The native slider maps to a plain view that keeps its props, so tests can
// read the thumb position and fire value changes.
jest.mock("@expo/ui/community/slider", () => {
  const { createElement } = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Slider: (props: Record<string, unknown>) => createElement(View, props),
  };
});

describe("SnapSliderInputField", () => {
  const sliderOptions = [
    { value: 1, label: "One" },
    { value: 2, label: "Two" },
    { value: 3, label: "Three" },
  ];

  it("renders labels and description", async () => {
    const onChange = jest.fn();
    const { getByText } = await render(
      <SnapSliderInputField
        startItem={1}
        sliderOptions={sliderOptions}
        descriptionText="Select a value"
        onChange={onChange}
      />,
    );

    expect(getByText("Select a value")).toBeTruthy();
    expect(getByText("One")).toBeTruthy();
    expect(getByText("Two")).toBeTruthy();
    expect(getByText("Three")).toBeTruthy();
  });

  it("calls onChange once per new option while dragging", async () => {
    const onChange = jest.fn();

    const { getByLabelText } = await render(
      <SnapSliderInputField
        startItem={0}
        sliderOptions={sliderOptions}
        onChange={onChange}
        accessibilityLabel="slider"
      />,
    );

    const slider = getByLabelText("slider");
    await fireEvent(slider, "valueChange", 1);
    await fireEvent(slider, "valueChange", 1);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("selects an option and moves the thumb when its label is tapped", async () => {
    const onChange = jest.fn();

    const { getByLabelText, getByText } = await render(
      <SnapSliderInputField
        startItem={0}
        sliderOptions={sliderOptions}
        onChange={onChange}
        accessibilityLabel="slider"
      />,
    );

    await fireEvent.press(getByText("Three"));

    expect(onChange).toHaveBeenCalledWith(3);
    expect(getByLabelText("slider").props.value).toBe(2);
  });

  it("draws the unfilled track in the high surface container color", async () => {
    const { getByLabelText } = await render(
      <SnapSliderInputField
        startItem={0}
        sliderOptions={sliderOptions}
        onChange={jest.fn()}
        accessibilityLabel="slider"
      />,
    );

    expect(getByLabelText("slider").props.maximumTrackTintColor).toBe(
      theme.colors.surfaceContainerHigh,
    );
  });

  it("marks the label of the selected option as selected", async () => {
    const { getByRole } = await render(
      <SnapSliderInputField
        startItem={1}
        sliderOptions={sliderOptions}
        onChange={jest.fn()}
      />,
    );

    expect(getByRole("button", { name: "Two" })).toBeSelected();
    expect(getByRole("button", { name: "One" })).not.toBeSelected();
  });
});

import React from "react";
import { fireEvent, render } from "../utils/testUtils";

import { SnapSliderInputField } from "./SnapSliderInputField";

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

  it("calls onChange with correct value on sliding complete", async () => {
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
    // Simulate sliding to index 1 (which corresponds to option value 2)
    fireEvent(slider, "slidingComplete", 1);

    expect(onChange).toHaveBeenCalledWith(2);
  });
});

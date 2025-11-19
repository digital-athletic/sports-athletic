import React from "react";
import { fireEvent, render } from "../../utils/testUtils";
import {
  TrainingRepetitionInput,
  TrainingRepetitionInputProps,
} from "./TrainingRepetitionInput";

describe("<TrainingRepetitionInput />", () => {
  const mockProps: TrainingRepetitionInputProps = {
    repsValue: 10,
    changeReps: jest.fn(),
    saveRepsInput: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { toJSON } = render(<TrainingRepetitionInput {...mockProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders with default props", () => {
    const { getByText } = render(<TrainingRepetitionInput {...mockProps} />);
    // Should render the title from translation
    expect(getByText("Power test")).toBeTruthy();
  });

  it("renders the power test description", () => {
    const { getByText } = render(<TrainingRepetitionInput {...mockProps} />);
    expect(
      getByText("Do as many repetitions as you can do with good technique.")
    ).toBeTruthy();
  });

  it("renders the input field with correct value", () => {
    const { getByDisplayValue } = render(
      <TrainingRepetitionInput {...mockProps} />
    );
    expect(getByDisplayValue("10")).toBeTruthy();
  });

  it("renders the save button", () => {
    const { getByText } = render(<TrainingRepetitionInput {...mockProps} />);
    expect(getByText("Save")).toBeTruthy();
  });

  it("calls changeReps when input value changes", () => {
    const mockChangeReps = jest.fn();
    const { getByDisplayValue } = render(
      <TrainingRepetitionInput {...mockProps} changeReps={mockChangeReps} />
    );

    const input = getByDisplayValue("10");
    // Simulate text input change
    input.props.onChangeText?.("15");
    expect(mockChangeReps).toHaveBeenCalledWith("15");
  });

  it("calls saveRepsInput when save button is pressed", () => {
    const mockSaveRepsInput = jest.fn();
    const { getByRole } = render(
      <TrainingRepetitionInput
        {...mockProps}
        saveRepsInput={mockSaveRepsInput}
      />
    );

    const saveButton = getByRole("button", { name: "Save" });
    fireEvent.press(saveButton);
    expect(mockSaveRepsInput).toHaveBeenCalled();
  });

  it("handles zero repetitions value", () => {
    const { getByDisplayValue } = render(
      <TrainingRepetitionInput {...mockProps} repsValue={0} />
    );
    expect(getByDisplayValue("0")).toBeTruthy();
  });

  it("handles large repetitions value", () => {
    const { getByDisplayValue } = render(
      <TrainingRepetitionInput {...mockProps} repsValue={100} />
    );
    expect(getByDisplayValue("100")).toBeTruthy();
  });

  it("renders with hashtag icon for repetitions input", () => {
    const { getByLabelText } = render(
      <TrainingRepetitionInput {...mockProps} />
    );
    // The hashtag icon should have accessibility label
    const icon = getByLabelText("input-icon");
    expect(icon).toBeTruthy();
  });

  it("uses keyboard type number-pad for input", () => {
    const { getByDisplayValue } = render(
      <TrainingRepetitionInput {...mockProps} />
    );
    const input = getByDisplayValue("10");
    expect(input.props.keyboardType).toBe("number-pad");
  });

  it("updates when repsValue prop changes", () => {
    const { rerender, getByDisplayValue } = render(
      <TrainingRepetitionInput {...mockProps} repsValue={10} />
    );
    expect(getByDisplayValue("10")).toBeTruthy();

    rerender(<TrainingRepetitionInput {...mockProps} repsValue={20} />);
    expect(getByDisplayValue("20")).toBeTruthy();
  });
});

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

  it("renders without crashing", async () => {
    const { toJSON } = await render(<TrainingRepetitionInput {...mockProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it("labels the input with the exercise name and the field", async () => {
    const { getByLabelText } = await render(
      <TrainingRepetitionInput {...mockProps} exerciseName="Squat" />,
    );
    expect(getByLabelText("Squat, repetitions")).toBeTruthy();
  });

  it("renders with default props", async () => {
    const { getByText } = await render(
      <TrainingRepetitionInput {...mockProps} />,
    );
    // Should render the title from translation
    expect(getByText("Power test")).toBeTruthy();
  });

  it("renders the power test description", async () => {
    const { getByText } = await render(
      <TrainingRepetitionInput {...mockProps} />,
    );
    expect(
      getByText("Do as many repetitions as you can do with good technique."),
    ).toBeTruthy();
  });

  it("renders the input field with correct value", async () => {
    const { getByDisplayValue } = await render(
      <TrainingRepetitionInput {...mockProps} />,
    );
    expect(getByDisplayValue("10")).toBeTruthy();
  });

  it("renders the save button", async () => {
    const { getByText } = await render(
      <TrainingRepetitionInput {...mockProps} />,
    );
    expect(getByText("Save")).toBeTruthy();
  });

  it("calls changeReps when input value changes", async () => {
    const mockChangeReps = jest.fn();
    const { getByDisplayValue } = await render(
      <TrainingRepetitionInput {...mockProps} changeReps={mockChangeReps} />,
    );

    const input = getByDisplayValue("10");
    // Simulate text input change
    input.props.onChangeText?.("15");
    expect(mockChangeReps).toHaveBeenCalledWith("15");
  });

  it("calls saveRepsInput when save button is pressed", async () => {
    const mockSaveRepsInput = jest.fn();
    const { getByRole } = await render(
      <TrainingRepetitionInput
        {...mockProps}
        saveRepsInput={mockSaveRepsInput}
      />,
    );

    const saveButton = getByRole("button", { name: "Save" });
    await fireEvent.press(saveButton);
    expect(mockSaveRepsInput).toHaveBeenCalled();
  });

  it("handles zero repetitions value", async () => {
    const { getByDisplayValue } = await render(
      <TrainingRepetitionInput {...mockProps} repsValue={0} />,
    );
    expect(getByDisplayValue("0")).toBeTruthy();
  });

  it("handles large repetitions value", async () => {
    const { getByDisplayValue } = await render(
      <TrainingRepetitionInput {...mockProps} repsValue={100} />,
    );
    expect(getByDisplayValue("100")).toBeTruthy();
  });

  it("renders the keypad icon hidden from screen readers", async () => {
    const { container } = await render(
      <TrainingRepetitionInput {...mockProps} />,
    );
    const [icon] = container.queryAll((node) => node.type === "Ionicons");
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });

  it("uses keyboard type number-pad for input", async () => {
    const { getByDisplayValue } = await render(
      <TrainingRepetitionInput {...mockProps} />,
    );
    const input = getByDisplayValue("10");
    expect(input.props.keyboardType).toBe("number-pad");
  });

  it("updates when repsValue prop changes", async () => {
    const { rerender, getByDisplayValue } = await render(
      <TrainingRepetitionInput {...mockProps} repsValue={10} />,
    );
    expect(getByDisplayValue("10")).toBeTruthy();

    await rerender(<TrainingRepetitionInput {...mockProps} repsValue={20} />);
    expect(getByDisplayValue("20")).toBeTruthy();
  });
});

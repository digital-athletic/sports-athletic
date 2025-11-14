import { fireEvent, render } from "../utils/testUtils";
import { CheckBox } from "./CheckBox";

describe("<CheckBox />", () => {
  it("renders in unchecked state", () => {
    const mockChanged = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={false} changed={mockChanged} />
    );
    const checkbox = getByRole("checkbox");
    expect(checkbox).toBeTruthy();
    expect(checkbox.props.accessibilityState.checked).toBe(false);
  });

  it("renders in checked state", () => {
    const mockChanged = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={true} changed={mockChanged} />
    );
    const checkbox = getByRole("checkbox");
    expect(checkbox).toBeTruthy();
    expect(checkbox.props.accessibilityState.checked).toBe(true);
  });

  it("calls changed callback with true when unchecked box is pressed", () => {
    const mockChanged = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={false} changed={mockChanged} />
    );
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(mockChanged).toHaveBeenCalledTimes(1);
    expect(mockChanged).toHaveBeenCalledWith(true);
  });

  it("calls changed callback with false when checked box is pressed", () => {
    const mockChanged = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={true} changed={mockChanged} />
    );
    const checkbox = getByRole("checkbox");
    fireEvent.press(checkbox);
    expect(mockChanged).toHaveBeenCalledTimes(1);
    expect(mockChanged).toHaveBeenCalledWith(false);
  });

  it("toggles state correctly on multiple presses", () => {
    const mockChanged = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={false} changed={mockChanged} />
    );
    const checkbox = getByRole("checkbox");

    fireEvent.press(checkbox);
    expect(mockChanged).toHaveBeenCalledWith(true);

    fireEvent.press(checkbox);
    expect(mockChanged).toHaveBeenCalledWith(true); // Still true since checked prop hasn't changed

    expect(mockChanged).toHaveBeenCalledTimes(2);
  });
});

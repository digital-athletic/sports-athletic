import Ionicons from "@expo/vector-icons/Ionicons";
import { fireEvent, render } from "../utils/testUtils";
import { CheckBox } from "./CheckBox";

const mount = (checked: boolean, changed = jest.fn()) => ({
  changed,
  ...render(<CheckBox checked={checked} changed={changed} />),
});

describe("CheckBox", () => {
  it("is unchecked when checked is false", () => {
    const { getByRole } = mount(false);
    expect(getByRole("checkbox").props.accessibilityState.checked).toBe(false);
  });

  it("is checked when checked is true", () => {
    const { getByRole } = mount(true);
    expect(getByRole("checkbox").props.accessibilityState.checked).toBe(true);
  });

  it("requests the inverse value when pressed", () => {
    const { changed, getByRole } = mount(false);
    fireEvent.press(getByRole("checkbox"));
    expect(changed).toHaveBeenCalledWith(true);
  });

  it("requests false when an already checked box is pressed", () => {
    const { changed, getByRole } = mount(true);
    fireEvent.press(getByRole("checkbox"));
    expect(changed).toHaveBeenCalledWith(false);
  });

  it("exposes the given accessibility label", () => {
    const { getByLabelText } = render(
      <CheckBox
        checked={false}
        changed={jest.fn()}
        accessibilityLabel="Datenschutz akzeptieren"
      />,
    );
    expect(getByLabelText("Datenschutz akzeptieren")).toBeTruthy();
  });

  it("hides the checkmark from screen readers", () => {
    const { UNSAFE_getByType } = mount(true);
    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });
});

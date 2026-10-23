import { fireEvent, render } from "../utils/testUtils";
import { HeaderIconButton } from "./HeaderIconButton";

describe("HeaderIconButton", () => {
  it("renders with the supplied accessibility label", () => {
    const { getByLabelText } = render(
      <HeaderIconButton
        iconName="close-circle"
        onPress={jest.fn()}
        accessibilityLabel="Abort training"
      />,
    );
    expect(getByLabelText("Abort training")).toBeTruthy();
  });

  it("exposes the button accessibility role", () => {
    const { getByRole } = render(
      <HeaderIconButton
        iconName="close-circle"
        onPress={jest.fn()}
        accessibilityLabel="Abort training"
      />,
    );
    expect(getByRole("button")).toBeTruthy();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <HeaderIconButton
        iconName="close-circle"
        onPress={onPress}
        accessibilityLabel="Abort training"
      />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("ignores presses when disabled", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <HeaderIconButton
        iconName="close-circle"
        onPress={onPress}
        accessibilityLabel="Abort training"
        disabled
      />,
    );
    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("reports the disabled state to screen readers when disabled", () => {
    const { getByRole } = render(
      <HeaderIconButton
        iconName="close-circle"
        onPress={jest.fn()}
        accessibilityLabel="Abort training"
        disabled
      />,
    );
    expect(getByRole("button").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
});

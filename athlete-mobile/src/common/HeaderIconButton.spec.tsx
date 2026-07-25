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
});

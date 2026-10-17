import Ionicons from "@expo/vector-icons/Ionicons";
import { fireEvent, render } from "../utils/testUtils";
import { EmailInputField } from "./EmailInputField";

describe("<EmailInputField />", () => {
  const defaultProps = {
    email: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { toJSON } = render(<EmailInputField {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("hides the email icon from screen readers", () => {
    const { UNSAFE_getByType } = render(<EmailInputField {...defaultProps} />);
    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });

  it("displays email placeholder", () => {
    const { getByPlaceholderText } = render(
      <EmailInputField {...defaultProps} />,
    );
    expect(getByPlaceholderText("E-Mail")).toBeTruthy();
  });

  it("displays the provided email value", () => {
    const { getByDisplayValue } = render(
      <EmailInputField {...defaultProps} email="test@example.com" />,
    );
    expect(getByDisplayValue("test@example.com")).toBeTruthy();
  });

  it("calls onChange when email input changes", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <EmailInputField {...defaultProps} onChange={onChange} />,
    );

    fireEvent.changeText(getByPlaceholderText("E-Mail"), "new@example.com");

    expect(onChange).toHaveBeenCalledWith("new@example.com");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("has email-address keyboard type", () => {
    const { getByPlaceholderText } = render(
      <EmailInputField {...defaultProps} />,
    );
    const input = getByPlaceholderText("E-Mail");
    expect(input.props.keyboardType).toBe("email-address");
  });

  it("has autoCapitalize set to none", () => {
    const { getByPlaceholderText } = render(
      <EmailInputField {...defaultProps} />,
    );
    const input = getByPlaceholderText("E-Mail");
    expect(input.props.autoCapitalize).toBe("none");
  });

  it("calls onFocus when input is focused", () => {
    const onFocus = jest.fn();
    const { getByPlaceholderText } = render(
      <EmailInputField {...defaultProps} onFocus={onFocus} />,
    );

    fireEvent(getByPlaceholderText("E-Mail"), "focus");

    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});

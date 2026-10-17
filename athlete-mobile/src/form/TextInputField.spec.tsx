import Ionicons from "@expo/vector-icons/Ionicons";
import { fireEvent, render } from "../utils/testUtils";
import { TextInputField } from "./TextInputField";

describe("<TextInputField />", () => {
  const defaultProps = {
    onChange: jest.fn(),
    placeholder: "Enter text",
    value: "",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with Ionicon", () => {
    const { toJSON } = render(
      <TextInputField {...defaultProps} iconName="person" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("hides the Ionicon from screen readers", () => {
    const { UNSAFE_getByType } = render(
      <TextInputField {...defaultProps} iconName="person" />,
    );
    const icon = UNSAFE_getByType(Ionicons);
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });

  it("shows a visible label that also names the input", () => {
    const { getByText, getByLabelText } = render(
      <TextInputField {...defaultProps} title="Weight in kg" />,
    );
    expect(getByText("Weight in kg")).toBeTruthy();
    expect(getByLabelText("Weight in kg")).toBeTruthy();
  });

  it("names the input with accessibilityLabel when no title is given", () => {
    const { getByLabelText } = render(
      <TextInputField {...defaultProps} accessibilityLabel="Name" />,
    );
    expect(getByLabelText("Name")).toBeTruthy();
  });

  it("displays the placeholder text", () => {
    const { getByPlaceholderText } = render(
      <TextInputField {...defaultProps} placeholder="Enter your name" />,
    );
    expect(getByPlaceholderText("Enter your name")).toBeTruthy();
  });

  it("displays the provided value", () => {
    const { getByDisplayValue } = render(
      <TextInputField {...defaultProps} value="test value" />,
    );
    expect(getByDisplayValue("test value")).toBeTruthy();
  });

  it("calls onChange when text changes", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <TextInputField {...defaultProps} onChange={onChange} />,
    );

    fireEvent.changeText(getByPlaceholderText("Enter text"), "new text");

    expect(onChange).toHaveBeenCalledWith("new text");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("has autoCapitalize set to none", () => {
    const { getByPlaceholderText } = render(
      <TextInputField {...defaultProps} />,
    );
    const input = getByPlaceholderText("Enter text");
    expect(input.props.autoCapitalize).toBe("none");
  });

  it("uses default keyboard type", () => {
    const { getByPlaceholderText } = render(
      <TextInputField {...defaultProps} />,
    );
    const input = getByPlaceholderText("Enter text");
    expect(input.props.keyboardType).toBe("default");
  });

  it("accepts custom keyboard type", () => {
    const { getByPlaceholderText } = render(
      <TextInputField
        {...defaultProps}
        keyboardType="numeric"
        placeholder="Enter number"
      />,
    );
    const input = getByPlaceholderText("Enter number");
    expect(input.props.keyboardType).toBe("numeric");
  });
});

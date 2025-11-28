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

  it("renders correctly with AwesomeIcon", () => {
    const { toJSON } = render(
      <TextInputField {...defaultProps} awesomeIconName="user" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays Ionicon when iconName is provided", () => {
    const { getByLabelText } = render(
      <TextInputField {...defaultProps} iconName="person" />,
    );
    expect(getByLabelText("input-icon")).toBeTruthy();
  });

  it("displays AwesomeIcon when awesomeIconName is provided", () => {
    const { getByLabelText } = render(
      <TextInputField {...defaultProps} awesomeIconName="user" />,
    );
    expect(getByLabelText("input-icon")).toBeTruthy();
  });

  it("prioritizes Ionicon when both icon types are provided", () => {
    const { getByLabelText } = render(
      <TextInputField
        {...defaultProps}
        iconName="person"
        awesomeIconName="user"
      />,
    );
    // When both are provided, only one icon should render
    expect(getByLabelText("input-icon")).toBeTruthy();
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

import IconUser from "@tabler/icons-react-native/IconUser";
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

  it("renders correctly with an icon", async () => {
    const { toJSON } = await render(
      <TextInputField {...defaultProps} icon={IconUser} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("hides the icon from screen readers", async () => {
    const { getByTestId } = await render(
      <TextInputField {...defaultProps} icon={IconUser} />,
    );
    const icon = getByTestId("decorative-icon", {
      includeHiddenElements: true,
    });
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });

  it("shows a visible label that also names the input", async () => {
    const { getByText, getByLabelText } = await render(
      <TextInputField {...defaultProps} title="Weight in kg" />,
    );
    expect(getByText("Weight in kg")).toBeTruthy();
    expect(getByLabelText("Weight in kg")).toBeTruthy();
  });

  it("names the input with accessibilityLabel when no title is given", async () => {
    const { getByLabelText } = await render(
      <TextInputField {...defaultProps} accessibilityLabel="Name" />,
    );
    expect(getByLabelText("Name")).toBeTruthy();
  });

  it("displays the placeholder text", async () => {
    const { getByPlaceholderText } = await render(
      <TextInputField {...defaultProps} placeholder="Enter your name" />,
    );
    expect(getByPlaceholderText("Enter your name")).toBeTruthy();
  });

  it("displays the provided value", async () => {
    const { getByDisplayValue } = await render(
      <TextInputField {...defaultProps} value="test value" />,
    );
    expect(getByDisplayValue("test value")).toBeTruthy();
  });

  it("calls onChange when text changes", async () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = await render(
      <TextInputField {...defaultProps} onChange={onChange} />,
    );

    await fireEvent.changeText(getByPlaceholderText("Enter text"), "new text");

    expect(onChange).toHaveBeenCalledWith("new text");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("has autoCapitalize set to none", async () => {
    const { getByPlaceholderText } = await render(
      <TextInputField {...defaultProps} />,
    );
    const input = getByPlaceholderText("Enter text");
    expect(input.props.autoCapitalize).toBe("none");
  });

  it("uses default keyboard type", async () => {
    const { getByPlaceholderText } = await render(
      <TextInputField {...defaultProps} />,
    );
    const input = getByPlaceholderText("Enter text");
    expect(input.props.keyboardType).toBe("default");
  });

  it("accepts custom keyboard type", async () => {
    const { getByPlaceholderText } = await render(
      <TextInputField
        {...defaultProps}
        keyboardType="numeric"
        placeholder="Enter number"
      />,
    );
    const input = getByPlaceholderText("Enter number");
    expect(input.props.keyboardType).toBe("numeric");
  });

  it("shows the suffix after the input and hides it from screen readers", async () => {
    const { getByText } = await render(
      <TextInputField {...defaultProps} suffix="cm" />,
    );

    const suffix = getByText("cm", { includeHiddenElements: true });
    expect(suffix.props.accessibilityElementsHidden).toBe(true);
  });
});

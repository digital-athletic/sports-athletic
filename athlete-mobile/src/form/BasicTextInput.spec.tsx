import { fireEvent, render } from "../utils/testUtils";
import { BasicTextInput } from "./BasicTextInput";

describe("<BasicTextInput />", () => {
  it("renders correctly", () => {
    const { toJSON } = render(
      <BasicTextInput value="test value" onChangeText={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders with placeholder", () => {
    const { getByPlaceholderText } = render(
      <BasicTextInput placeholder="Enter text" onChangeText={jest.fn()} />,
    );
    expect(getByPlaceholderText("Enter text")).toBeTruthy();
  });

  it("displays the provided value", () => {
    const { getByDisplayValue } = render(
      <BasicTextInput value="test value" onChangeText={jest.fn()} />,
    );
    expect(getByDisplayValue("test value")).toBeTruthy();
  });

  it("calls onChangeText when text changes", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <BasicTextInput placeholder="Enter text" onChangeText={onChangeText} />,
    );

    fireEvent.changeText(getByPlaceholderText("Enter text"), "new text");

    expect(onChangeText).toHaveBeenCalledWith("new text");
    expect(onChangeText).toHaveBeenCalledTimes(1);
  });

  it("accepts custom keyboard type", () => {
    const { getByPlaceholderText } = render(
      <BasicTextInput
        placeholder="Enter email"
        keyboardType="email-address"
        onChangeText={jest.fn()}
      />,
    );

    const input = getByPlaceholderText("Enter email");
    expect(input.props.keyboardType).toBe("email-address");
  });

  it("accepts secureTextEntry prop", () => {
    const { getByPlaceholderText } = render(
      <BasicTextInput
        placeholder="Enter password"
        secureTextEntry
        onChangeText={jest.fn()}
      />,
    );

    const input = getByPlaceholderText("Enter password");
    expect(input.props.secureTextEntry).toBe(true);
  });

  it("accepts autoCapitalize prop", () => {
    const { getByPlaceholderText } = render(
      <BasicTextInput
        placeholder="Enter text"
        autoCapitalize="none"
        onChangeText={jest.fn()}
      />,
    );

    const input = getByPlaceholderText("Enter text");
    expect(input.props.autoCapitalize).toBe("none");
  });
});

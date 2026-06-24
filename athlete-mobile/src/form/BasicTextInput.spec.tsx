import { fireEvent, render } from "../utils/testUtils";
import { BasicTextInput } from "./BasicTextInput";

describe("BasicTextInput", () => {
  it("matches the snapshot", () => {
    const { toJSON } = render(
      <BasicTextInput value="hello" onChangeText={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays the current value", () => {
    const { getByDisplayValue } = render(
      <BasicTextInput value="hello" onChangeText={jest.fn()} />,
    );
    expect(getByDisplayValue("hello")).toBeTruthy();
  });

  it("shows the placeholder", () => {
    const { getByPlaceholderText } = render(
      <BasicTextInput placeholder="Name" onChangeText={jest.fn()} />,
    );
    expect(getByPlaceholderText("Name")).toBeTruthy();
  });

  it("forwards edits to onChangeText", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <BasicTextInput placeholder="Name" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByPlaceholderText("Name"), "world");
    expect(onChangeText).toHaveBeenCalledWith("world");
  });

  it("forwards native TextInput props such as secureTextEntry", () => {
    const { getByPlaceholderText } = render(
      <BasicTextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={jest.fn()}
      />,
    );
    expect(getByPlaceholderText("Password").props.secureTextEntry).toBe(true);
  });
});

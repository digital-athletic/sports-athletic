import { fireEvent, render } from "../utils/testUtils";
import { BasicTextInput } from "./BasicTextInput";

describe("BasicTextInput", () => {
  it("matches the snapshot", async () => {
    const { toJSON } = await render(
      <BasicTextInput value="hello" onChangeText={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays the current value", async () => {
    const { getByDisplayValue } = await render(
      <BasicTextInput value="hello" onChangeText={jest.fn()} />,
    );
    expect(getByDisplayValue("hello")).toBeTruthy();
  });

  it("shows the placeholder", async () => {
    const { getByPlaceholderText } = await render(
      <BasicTextInput placeholder="Name" onChangeText={jest.fn()} />,
    );
    expect(getByPlaceholderText("Name")).toBeTruthy();
  });

  it("forwards edits to onChangeText", async () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = await render(
      <BasicTextInput placeholder="Name" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByPlaceholderText("Name"), "world");
    expect(onChangeText).toHaveBeenCalledWith("world");
  });

  it("forwards native TextInput props such as secureTextEntry", async () => {
    const { getByPlaceholderText } = await render(
      <BasicTextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={jest.fn()}
      />,
    );
    expect(getByPlaceholderText("Password").props.secureTextEntry).toBe(true);
  });
});

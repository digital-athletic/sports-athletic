import { Keyboard, Platform } from "react-native";
import { Text } from "@/theme/Text";
import { fireEvent, render } from "../utils/testUtils";
import { KeyboardDismissArea } from "./KeyboardDismissArea";

describe("KeyboardDismissArea: closing the keyboard", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("closes the keyboard on a press in the native app", async () => {
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    const { getByText } = await render(
      <KeyboardDismissArea>
        <Text>Screen content</Text>
      </KeyboardDismissArea>,
    );

    await fireEvent.press(getByText("Screen content"));

    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it("does not close the keyboard on a press on web", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    const { getByText } = await render(
      <KeyboardDismissArea>
        <Text>Screen content</Text>
      </KeyboardDismissArea>,
    );

    await fireEvent.press(getByText("Screen content"));

    expect(dismiss).not.toHaveBeenCalled();
  });
});

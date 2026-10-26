import { Platform } from "react-native";
import { render } from "../utils/testUtils";
import { DateInputField } from "./DateInputField";

describe("DateInputField: screen reader labels", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("passes the label to the iOS picker", async () => {
    const { getByLabelText } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={jest.fn()}
        accessibilityLabel="Birthday"
      />,
    );

    expect(getByLabelText("Birthday").type).toBe("RNDateTimePicker");
  });

  it("names the Android picker button", async () => {
    jest
      .spyOn(Platform, "select")
      .mockImplementation((spec) =>
        "android" in spec ? spec.android : undefined,
      );

    const { getByRole } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={jest.fn()}
        accessibilityLabel="Birthday"
      />,
    );

    expect(getByRole("button", { name: "Birthday" })).toBeTruthy();
  });
});

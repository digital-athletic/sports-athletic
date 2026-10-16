import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import { render } from "../utils/testUtils";
import { DateInputField } from "./DateInputField";

describe("DateInputField: screen reader labels", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("passes the label to the iOS picker", () => {
    const { UNSAFE_getByType } = render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={jest.fn()}
        accessibilityLabel="Birthday"
      />,
    );

    expect(UNSAFE_getByType(DateTimePicker).props.accessibilityLabel).toBe(
      "Birthday",
    );
  });

  it("names the Android picker button", () => {
    jest
      .spyOn(Platform, "select")
      .mockImplementation((spec) =>
        "android" in spec ? spec.android : undefined,
      );

    const { getByRole } = render(
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

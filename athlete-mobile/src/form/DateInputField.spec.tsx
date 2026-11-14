import { Platform } from "react-native";
import { fireEvent, render } from "../utils/testUtils";
import { DateInputField } from "./DateInputField";

describe("DateInputField: web input", () => {
  beforeEach(() => {
    jest
      .spyOn(Platform, "select")
      .mockImplementation((spec) => ("web" in spec ? spec.web : undefined));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("names the input and sets its value and limits", async () => {
    const { getByLabelText } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={jest.fn()}
        minimumDate={new Date(1990, 0, 1)}
        maximumDate={new Date(2010, 11, 31)}
        accessibilityLabel="Birthday"
      />,
    );

    const input = getByLabelText("Birthday");
    expect(input.type).toBe("input");
    expect(input.props).toMatchObject({
      type: "date",
      value: "2000-01-31",
      min: "1990-01-01",
      max: "2010-12-31",
    });
  });

  it("shows no leading icon, because the browser draws its own picker button", async () => {
    const { queryByTestId } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={jest.fn()}
        accessibilityLabel="Birthday"
      />,
    );

    expect(
      queryByTestId("decorative-icon", { includeHiddenElements: true }),
    ).toBeNull();
  });

  it("uses the default minimum when the caller sets none", async () => {
    const { getByLabelText } = await render(
      <DateInputField
        type="date"
        onChange={jest.fn()}
        accessibilityLabel="Birthday"
      />,
    );

    expect(getByLabelText("Birthday").props).toMatchObject({
      value: "",
      min: "1920-01-01",
    });
  });

  it("calls onChange with a complete date inside the limits", async () => {
    const onChange = jest.fn();

    const { getByLabelText } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={onChange}
        maximumDate={new Date(2010, 11, 31)}
        accessibilityLabel="Birthday"
      />,
    );
    await fireEvent(getByLabelText("Birthday"), "change", {
      target: { value: "2000-02-01" },
    });

    expect(onChange).toHaveBeenCalledWith("2000-02-01");
  });

  it.each([
    ["an empty value", ""],
    ["a date before the minimum", "1919-12-31"],
    ["a date after the maximum", "2011-01-01"],
    ["a year with five digits", "19300-05-17"],
  ])("does not call onChange with %s", async (_, value) => {
    const onChange = jest.fn();

    const { getByLabelText } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={onChange}
        maximumDate={new Date(2010, 11, 31)}
        accessibilityLabel="Birthday"
      />,
    );
    await fireEvent(getByLabelText("Birthday"), "change", {
      target: { value },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a typed value until the blur, then the last valid date", async () => {
    const { getByLabelText } = await render(
      <DateInputField
        type="date"
        dateTime="2000-01-31"
        onChange={jest.fn()}
        accessibilityLabel="Birthday"
      />,
    );
    await fireEvent(getByLabelText("Birthday"), "change", {
      target: { value: "" },
    });
    expect(getByLabelText("Birthday").props.value).toBe("");

    await fireEvent(getByLabelText("Birthday"), "blur");
    expect(getByLabelText("Birthday").props.value).toBe("2000-01-31");
  });
});

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

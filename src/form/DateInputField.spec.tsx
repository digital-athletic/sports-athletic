import { render } from "../utils/testUtils";
import { DateInputField } from "./DateInputField";

// Mock react-native-date-picker
jest.mock("react-native-date-picker", () => "DatePicker");

describe("<DateInputField />", () => {
  const defaultProps = {
    type: "date" as const,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly for date type", () => {
    const { toJSON } = render(
      <DateInputField {...defaultProps} dateTime="01-01-1999" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders correctly for time type", () => {
    const { toJSON } = render(
      <DateInputField {...defaultProps} dateTime="12:00" type="time" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays calendar icon for date type", () => {
    const { getByLabelText } = render(<DateInputField {...defaultProps} />);
    expect(getByLabelText("date-icon")).toBeTruthy();
  });

  it("displays time icon for time type", () => {
    const { getByLabelText } = render(
      <DateInputField {...defaultProps} type="time" />
    );
    expect(getByLabelText("time-icon")).toBeTruthy();
  });

  it("displays choose text when no dateTime is provided", () => {
    const { getByText } = render(
      <DateInputField {...defaultProps} dateTime={undefined} />
    );
    expect(getByText("Choose")).toBeTruthy();
  });

  it("displays the provided dateTime value", () => {
    const { getByText } = render(
      <DateInputField {...defaultProps} dateTime="15-06-2024" />
    );
    expect(getByText("15-06-2024")).toBeTruthy();
  });

  it("displays the provided time value", () => {
    const { getByText } = render(
      <DateInputField {...defaultProps} type="time" dateTime="14:30" />
    );
    expect(getByText("14:30")).toBeTruthy();
  });

  it("displays the provided time value", () => {
    const { getByText } = render(
      <DateInputField {...defaultProps} type="time" dateTime="12:00" />
    );
    expect(getByText("12:00")).toBeTruthy();
  });

  it("renders with empty value initially", () => {
    const { getByText } = render(
      <DateInputField {...defaultProps} dateTime="" />
    );
    expect(getByText("Choose")).toBeTruthy();
  });
});

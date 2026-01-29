import { render } from "../utils/testUtils";
import { DateInputField } from "./DateInputField";

// Mock react-native-date-picker
jest.mock("@react-native-community/datetimepicker", () => "DatePicker");

describe("<DateInputField />", () => {
  const defaultProps = {
    type: "date" as const,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip("renders correctly for date type", () => {
    const { toJSON } = render(
      <DateInputField {...defaultProps} dateTime="1999-01-01" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it.skip("renders correctly for time type", () => {
    const { toJSON } = render(
      <DateInputField {...defaultProps} dateTime="12:00" type="time" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays calendar icon for date type", () => {
    const { getByLabelText } = render(<DateInputField {...defaultProps} />);
    expect(getByLabelText("date-icon")).toBeTruthy();
  });

  it("displays time icon for time type", () => {
    const { getByLabelText } = render(
      <DateInputField {...defaultProps} type="time" />,
    );
    expect(getByLabelText("time-icon")).toBeTruthy();
  });
});

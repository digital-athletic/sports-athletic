import { fireEvent, render } from "../utils/testUtils";
import { PasswordInputField } from "./PasswordInputField";

describe("<PasswordInputField />", () => {
  const defaultProps = {
    password: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { toJSON } = render(<PasswordInputField {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays the lock icon", () => {
    const { getByLabelText } = render(<PasswordInputField {...defaultProps} />);
    const icon = getByLabelText("lock-closed");
    expect(icon).toBeTruthy();
  });

  it("displays the eye icon for visibility toggle", () => {
    const { getByLabelText } = render(<PasswordInputField {...defaultProps} />);
    const icon = getByLabelText("eye");
    expect(icon).toBeTruthy();
  });

  it("displays password placeholder", () => {
    const { getByPlaceholderText } = render(
      <PasswordInputField {...defaultProps} />
    );
    expect(getByPlaceholderText("Password")).toBeTruthy();
  });

  it("displays the provided password value", () => {
    const { getByDisplayValue } = render(
      <PasswordInputField {...defaultProps} password="secretpass" />
    );
    expect(getByDisplayValue("secretpass")).toBeTruthy();
  });

  it("calls onChange when password input changes", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <PasswordInputField {...defaultProps} onChange={onChange} />
    );

    fireEvent.changeText(getByPlaceholderText("Password"), "newpassword");

    expect(onChange).toHaveBeenCalledWith("newpassword");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("has secureTextEntry enabled by default", () => {
    const { getByPlaceholderText } = render(
      <PasswordInputField {...defaultProps} />
    );
    const input = getByPlaceholderText("Password");
    expect(input.props.secureTextEntry).toBe(true);
  });

  it("toggles password visibility on eye icon press", () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <PasswordInputField {...defaultProps} />
    );
    const input = getByPlaceholderText("Password");
    const eyeIcon = getByLabelText("eye");

    // Initially secure
    expect(input.props.secureTextEntry).toBe(true);

    // Press in to show password
    fireEvent(eyeIcon.parent, "pressIn");
    expect(input.props.secureTextEntry).toBe(false);

    // Press out to hide password
    fireEvent(eyeIcon.parent, "pressOut");
    expect(input.props.secureTextEntry).toBe(true);
  });

  it("maintains toggle state through multiple presses", () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <PasswordInputField {...defaultProps} />
    );
    const input = getByPlaceholderText("Password");
    const eyeIcon = getByLabelText("eye");

    // First toggle
    fireEvent(eyeIcon.parent, "pressIn");
    expect(input.props.secureTextEntry).toBe(false);
    fireEvent(eyeIcon.parent, "pressOut");
    expect(input.props.secureTextEntry).toBe(true);

    // Second toggle
    fireEvent(eyeIcon.parent, "pressIn");
    expect(input.props.secureTextEntry).toBe(false);
    fireEvent(eyeIcon.parent, "pressOut");
    expect(input.props.secureTextEntry).toBe(true);
  });
});

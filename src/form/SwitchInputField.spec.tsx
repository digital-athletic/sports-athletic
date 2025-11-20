import { fireEvent, render } from "../utils/testUtils";
import { SwitchInputField } from "./SwitchInputField";

describe("<SwitchInputField />", () => {
  const defaultProps = {
    value: false,
    descriptionText: "Enable notifications",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { toJSON } = render(<SwitchInputField {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays the description text", () => {
    const { getByText } = render(<SwitchInputField {...defaultProps} />);
    expect(getByText("Enable notifications")).toBeTruthy();
  });

  it("renders switch with correct initial value", () => {
    const { getByLabelText } = render(
      <SwitchInputField {...defaultProps} value={true} />
    );
    const switchComponent = getByLabelText("switch-input");
    expect(switchComponent.props.value).toBe(true);
  });

  it("calls onChange when switch is toggled", () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <SwitchInputField {...defaultProps} onChange={onChange} />
    );
    const switchComponent = getByLabelText("switch-input");

    fireEvent(switchComponent, "valueChange", true);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("toggles between true and false", () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <SwitchInputField {...defaultProps} onChange={onChange} />
    );
    const switchComponent = getByLabelText("switch-input");

    fireEvent(switchComponent, "valueChange", true);
    expect(onChange).toHaveBeenCalledWith(true);

    fireEvent(switchComponent, "valueChange", false);
    expect(onChange).toHaveBeenCalledWith(false);

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("applies normal size by default", () => {
    const { getByLabelText } = render(<SwitchInputField {...defaultProps} />);
    const switchComponent = getByLabelText("switch-input");
    // Style includes alignSelf for positioning
    expect(switchComponent.props.style).toBeDefined();
  });

  it("applies small size styling when size is small", () => {
    const { getByLabelText } = render(
      <SwitchInputField {...defaultProps} size="small" />
    );
    const switchComponent = getByLabelText("switch-input");
    // Check that transform is in the style array
    const hasTransform =
      Array.isArray(switchComponent.props.style) &&
      switchComponent.props.style.some(
        (s: any) => s.transform && Array.isArray(s.transform)
      );
    expect(hasTransform).toBe(true);
  });

  it("uses custom color when provided", () => {
    const { getByLabelText } = render(
      <SwitchInputField {...defaultProps} color="#FF0000" />
    );
    const switchComponent = getByLabelText("switch-input");
    // trackColor is set via onTintColor prop on native switch
    expect(switchComponent.props.onTintColor).toBe("#FF0000");
  });

  it("uses custom thumbColor when provided", () => {
    const { getByLabelText } = render(
      <SwitchInputField {...defaultProps} thumbColor="#00FF00" />
    );
    const switchComponent = getByLabelText("switch-input");
    // thumbColor is set via thumbTintColor prop on native switch
    expect(switchComponent.props.thumbTintColor).toBe("#00FF00");
  });

  it("renders with long description text", () => {
    const longText =
      "This is a very long description text that explains what this switch does in detail";
    const { getByText } = render(
      <SwitchInputField {...defaultProps} descriptionText={longText} />
    );
    expect(getByText(longText)).toBeTruthy();
  });
});

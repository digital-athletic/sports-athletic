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

  it("renders correctly", async () => {
    const { toJSON } = await render(<SwitchInputField {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("displays the description text", async () => {
    const { getByText } = await render(<SwitchInputField {...defaultProps} />);
    expect(getByText("Enable notifications")).toBeTruthy();
  });

  it("renders switch with correct initial value", async () => {
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} value={true} />,
    );
    const switchComponent = getByLabelText("Enable notifications");
    expect(switchComponent.props.value).toBe(true);
  });

  it("calls onChange when switch is toggled", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} onChange={onChange} />,
    );
    const switchComponent = getByLabelText("Enable notifications");

    await fireEvent(switchComponent, "valueChange", true);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("toggles between true and false", async () => {
    const onChange = jest.fn();
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} onChange={onChange} />,
    );
    const switchComponent = getByLabelText("Enable notifications");

    await fireEvent(switchComponent, "valueChange", true);
    expect(onChange).toHaveBeenCalledWith(true);

    await fireEvent(switchComponent, "valueChange", false);
    expect(onChange).toHaveBeenCalledWith(false);

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("applies normal size by default", async () => {
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} />,
    );
    const switchComponent = getByLabelText("Enable notifications");
    // Style includes alignSelf for positioning
    expect(switchComponent.props.style).toBeDefined();
  });

  it("applies small size styling when size is small", async () => {
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} size="small" />,
    );
    const switchComponent = getByLabelText("Enable notifications");
    // Check that transform is in the style array
    const hasTransform =
      Array.isArray(switchComponent.props.style) &&
      switchComponent.props.style.some(
        (s: any) => s.transform && Array.isArray(s.transform),
      );
    expect(hasTransform).toBe(true);
  });

  it("uses custom color when provided", async () => {
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} color="#FF0000" />,
    );
    const switchComponent = getByLabelText("Enable notifications");
    // trackColor is set via onTintColor prop on native switch
    expect(switchComponent.props.onTintColor).toBe("#FF0000");
  });

  it("uses custom thumbColor when provided", async () => {
    const { getByLabelText } = await render(
      <SwitchInputField {...defaultProps} thumbColor="#00FF00" />,
    );
    const switchComponent = getByLabelText("Enable notifications");
    // thumbColor is set via thumbTintColor prop on native switch
    expect(switchComponent.props.thumbTintColor).toBe("#00FF00");
  });

  it("renders with long description text", async () => {
    const longText =
      "This is a very long description text that explains what this switch does in detail";
    const { getByText } = await render(
      <SwitchInputField {...defaultProps} descriptionText={longText} />,
    );
    expect(getByText(longText)).toBeTruthy();
  });
});

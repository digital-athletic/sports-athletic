import { fireEvent, render } from "@/utils/testUtils";
import {
  FullScreenCoaching,
  FullScreenCoachingProps,
} from "./FullScreenCoaching";

describe("FullScreenCoaching", () => {
  const defaultProps: FullScreenCoachingProps = {
    text: "This is coaching text",
    trainerSource: 2197,
    goOnText: "Continue",
    goOnFunction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders component", () => {
    const { getByText } = render(<FullScreenCoaching {...defaultProps} />);

    expect(getByText("This is coaching text")).toBeTruthy();
    expect(getByText("Continue")).toBeTruthy();
  });

  it("calls goOnFunction when Continue button is pressed", () => {
    const goOnFn = jest.fn();
    const { getByRole } = render(
      <FullScreenCoaching {...defaultProps} goOnFunction={goOnFn} />,
    );

    const button = getByRole("button");
    fireEvent.press(button);

    expect(goOnFn).toHaveBeenCalledTimes(1);
  });

  it("renders skip text and calls skipFunction when provided", () => {
    const skipFn = jest.fn();
    const { getByText } = render(
      <FullScreenCoaching
        {...defaultProps}
        skipText="Skip this"
        skipFunction={skipFn}
      />,
    );

    const skipButton = getByText("Skip this");
    expect(skipButton).toBeTruthy();

    fireEvent.press(skipButton);
    expect(skipFn).toHaveBeenCalledTimes(1);
  });

  it("does not render skip text when skipText is not provided", () => {
    const { queryByText } = render(<FullScreenCoaching {...defaultProps} />);

    expect(queryByText("Skip this")).toBeFalsy();
  });

  it("does not render skip text when skipFunction is not provided", () => {
    const { queryByText } = render(
      <FullScreenCoaching {...defaultProps} skipText="Skip this" />,
    );

    expect(queryByText("Skip this")).toBeFalsy();
  });

  it("renders trainer image with accessibility label", () => {
    const { getByLabelText } = render(<FullScreenCoaching {...defaultProps} />);

    expect(getByLabelText("Coach face")).toBeTruthy();
  });

  it("renders coach text in speech bubble", () => {
    const coachingText = "Get ready for your power test!";
    const { getByText } = render(
      <FullScreenCoaching {...defaultProps} text={coachingText} />,
    );

    expect(getByText(coachingText)).toBeTruthy();
  });

  it("has both goOn and skip buttons with correct text", () => {
    const { getByText } = render(
      <FullScreenCoaching
        {...defaultProps}
        goOnText="Start Power Test"
        skipText="Skip for now"
        skipFunction={jest.fn()}
      />,
    );

    expect(getByText("Start Power Test")).toBeTruthy();
    expect(getByText("Skip for now")).toBeTruthy();
  });

  it("button is accessible with correct role", () => {
    const { getAllByRole } = render(
      <FullScreenCoaching
        {...defaultProps}
        skipText="Skip"
        skipFunction={jest.fn()}
      />,
    );

    const buttons = getAllByRole("button");
    expect(buttons.length).toBe(2); // goOn button + skip button
  });

  it("renders trainer image from provided source", () => {
    const { getByLabelText } = render(<FullScreenCoaching {...defaultProps} />);

    const image = getByLabelText("Coach face");
    expect(image.props.source).toBe(defaultProps.trainerSource);
  });

  it("supports responsive layout with proper flex values", () => {
    const { root } = render(<FullScreenCoaching {...defaultProps} />);

    const mainContainer = root.findByProps({ flex: 1 });
    expect(mainContainer).toBeTruthy();

    // Should have content section (flex 5) and buttons section (flex 1)
    const flexContainers = root.findAllByProps({ flex: 5 });
    expect(flexContainers.length).toBeGreaterThan(0);
  });
});

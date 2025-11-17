import { fireEvent, render } from "../utils/testUtils";
import { FormNavigationButtons } from "./FormNavigationButtons";

describe("<FormNavigationButtons />", () => {
  const defaultProps = {
    back: jest.fn(),
    backText: "Back",
    forward: jest.fn(),
    forwardText: "Next",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { toJSON } = render(<FormNavigationButtons {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders both buttons with correct text", () => {
    const { getByText } = render(<FormNavigationButtons {...defaultProps} />);

    expect(getByText("Back")).toBeTruthy();
    expect(getByText("Next")).toBeTruthy();
  });

  it("calls back callback when back button is pressed", () => {
    const back = jest.fn();
    const { getByText } = render(
      <FormNavigationButtons {...defaultProps} back={back} />
    );

    fireEvent.press(getByText("Back"));

    expect(back).toHaveBeenCalledTimes(1);
    expect(defaultProps.forward).not.toHaveBeenCalled();
  });

  it("calls forward callback when forward button is pressed", () => {
    const forward = jest.fn();
    const { getByText } = render(
      <FormNavigationButtons {...defaultProps} forward={forward} />
    );

    fireEvent.press(getByText("Next"));

    expect(forward).toHaveBeenCalledTimes(1);
    expect(defaultProps.back).not.toHaveBeenCalled();
  });

  it("renders custom button text", () => {
    const { getByText } = render(
      <FormNavigationButtons
        {...defaultProps}
        backText="Previous"
        forwardText="Continue"
      />
    );

    expect(getByText("Previous")).toBeTruthy();
    expect(getByText("Continue")).toBeTruthy();
  });

  it("allows multiple button presses", () => {
    const back = jest.fn();
    const forward = jest.fn();
    const { getByText } = render(
      <FormNavigationButtons {...defaultProps} back={back} forward={forward} />
    );

    fireEvent.press(getByText("Back"));
    fireEvent.press(getByText("Next"));
    fireEvent.press(getByText("Back"));

    expect(back).toHaveBeenCalledTimes(2);
    expect(forward).toHaveBeenCalledTimes(1);
  });
});

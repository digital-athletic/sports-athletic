import { render, screen } from "@/utils/testUtils";
import { TrainingProgressBar } from "./TrainingProgressBar";

const getFillWidth = () => {
  const fill = screen.getByTestId("training-progress-bar-fill");
  const flatStyle = Array.isArray(fill.props.style)
    ? Object.assign({}, ...fill.props.style)
    : fill.props.style;
  return flatStyle.width;
};

describe("TrainingProgressBar: fill width", () => {
  it("renders no fill width at progress 0", () => {
    render(<TrainingProgressBar progress={0} />);
    expect(getFillWidth()).toBe("0%");
  });

  it("renders a half fill width at progress 0.5", () => {
    render(<TrainingProgressBar progress={0.5} />);
    expect(getFillWidth()).toBe("50%");
  });

  it("renders a full fill width at progress 1", () => {
    render(<TrainingProgressBar progress={1} />);
    expect(getFillWidth()).toBe("100%");
  });
});

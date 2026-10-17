import { fireEvent, render } from "../../utils/testUtils";
import { TrainingCountdown } from "./TrainingCountdown";

jest.mock("./hooks/useCountdown", () => ({
  useCountdown: () => 75,
}));
jest.mock("./hooks/useVoiceCoach", () => ({
  useVoiceCoach: jest.fn(),
}));

describe("TrainingCountdown: pause toggle", () => {
  const renderCountdown = (onEvent = jest.fn()) =>
    render(
      <TrainingCountdown
        autoAdvance={false}
        duration={90}
        exerciseId="squat"
        isActive
        isFirstDurationInTraining={false}
        nextExerciseId={undefined}
        onEvent={onEvent}
      />,
    );

  it("exposes a button with the pause label and the remaining time in 10 second buckets", () => {
    const { getByRole } = renderCountdown();
    const toggle = getByRole("button", { name: "Pause" });
    expect(toggle.props.accessibilityValue).toEqual({
      text: "80 seconds left",
    });
  });

  it("exposes the exact remaining time while paused", () => {
    const { getByRole } = renderCountdown();
    fireEvent.press(getByRole("button", { name: "Pause" }));
    expect(
      getByRole("button", { name: "Resume" }).props.accessibilityValue,
    ).toEqual({ text: "75 seconds left" });
  });

  it("switches the label to resume after a tap", () => {
    const onEvent = jest.fn();
    const { getByRole } = renderCountdown(onEvent);
    fireEvent.press(getByRole("button", { name: "Pause" }));
    expect(getByRole("button", { name: "Resume" })).toBeTruthy();
    expect(onEvent).toHaveBeenCalledWith("pause");
  });
});

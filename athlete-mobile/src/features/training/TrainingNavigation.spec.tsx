import { fireEvent, render, screen } from "@/utils/testUtils";
import { TrainingNavigation } from "./TrainingNavigation";

jest.mock("./TrainingCountdown", () => ({
  TrainingCountdown: () => {
    const { View } = require("react-native");
    return <View testID="countdown-timer" />;
  },
}));

const defaultProps = {
  exerciseId: "123",
  nextExerciseId: undefined,
  feedback: jest.fn(),
  isCountdownActive: true,
  isFirstDurationInTraining: false,
  isLastInSet: true,
  isFeedbackSkill: false,
  isCardioExercise: false,
  isLastCardioExercise: false,
  isTest: false,
  next: jest.fn(),
  onSubmitReps: jest.fn().mockReturnValue(null),
  pauseToggled: jest.fn(),
};

describe("TrainingNavigation: checkmark path (duration undefined)", () => {
  it("renders checkmark icon when duration is undefined", async () => {
    await render(<TrainingNavigation {...defaultProps} duration={undefined} />);
    expect(screen.getByLabelText("Finish exercise")).toBeTruthy();
  });

  it("does not render countdown timer when duration is undefined", async () => {
    await render(<TrainingNavigation {...defaultProps} duration={undefined} />);
    expect(screen.queryByTestId("countdown-timer")).toBeNull();
  });

  it("calls next when checkmark is pressed", async () => {
    const next = jest.fn();
    await render(
      <TrainingNavigation {...defaultProps} duration={undefined} next={next} />,
    );
    fireEvent.press(screen.getByLabelText("Finish exercise"));
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("hides feedback buttons when isFeedbackSkill is false", async () => {
    await render(
      <TrainingNavigation
        {...defaultProps}
        duration={undefined}
        isFeedbackSkill={false}
      />,
    );
    expect(screen.queryByText("too easy")).toBeNull();
    expect(screen.queryByText("too hard")).toBeNull();
  });

  it("shows feedback buttons when isFeedbackSkill is true and isLastInSet", async () => {
    await render(
      <TrainingNavigation
        {...defaultProps}
        duration={undefined}
        isFeedbackSkill={true}
      />,
    );
    expect(screen.getByText("too easy")).toBeTruthy();
    expect(screen.getByText("too hard")).toBeTruthy();
  });

  it("sends no feedback from the checkmark when feedback is hidden", async () => {
    const feedback = jest.fn();
    await render(
      <TrainingNavigation
        {...defaultProps}
        duration={undefined}
        feedback={feedback}
      />,
    );
    fireEvent.press(screen.getByLabelText("Finish exercise"));
    expect(feedback).not.toHaveBeenCalled();
  });

  it("sends SUCCEEDED from the checkmark next to the feedback buttons", async () => {
    const feedback = jest.fn();
    await render(
      <TrainingNavigation
        {...defaultProps}
        duration={undefined}
        feedback={feedback}
        isFeedbackSkill={true}
      />,
    );
    fireEvent.press(screen.getByLabelText("Finish exercise"));
    expect(feedback).toHaveBeenCalledWith("SUCCEEDED");
  });
});

describe("TrainingNavigation: timer path (duration number)", () => {
  it("renders countdown timer when duration is provided", async () => {
    await render(<TrainingNavigation {...defaultProps} duration={30} />);
    expect(screen.getByTestId("countdown-timer")).toBeTruthy();
  });

  it("does not show checkmark while timer is active", async () => {
    await render(<TrainingNavigation {...defaultProps} duration={30} />);
    expect(screen.queryByLabelText("Finish exercise")).toBeNull();
  });

  it("hides feedback buttons until timer ends even when isFeedbackSkill is true", async () => {
    await render(
      <TrainingNavigation
        {...defaultProps}
        duration={30}
        isFeedbackSkill={true}
        isLastInSet={true}
      />,
    );
    expect(screen.queryByText("too easy")).toBeNull();
    expect(screen.queryByText("too hard")).toBeNull();
  });
});

import { render } from "../../utils/testUtils";
import {
  TrainingListItemActions,
  type TrainingListItemActionsProps,
} from "./TrainingListItemActions";

describe("TrainingListItemActions: accessible names", () => {
  const baseProps: TrainingListItemActionsProps = {
    isTest: false,
    isCompleted: false,
    isFeedbackEligible: false,
    repsValue: 0,
    onComplete: jest.fn(),
    onSkip: jest.fn(),
    testId: "row",
  };

  it("names the check button of a pending row Finish exercise", () => {
    const { getByLabelText, queryByLabelText } = render(
      <TrainingListItemActions {...baseProps} />,
    );

    expect(getByLabelText("Finish exercise")).toBeTruthy();
    expect(queryByLabelText("Completed")).toBeNull();
  });

  it("names the check button of a completed row Completed", () => {
    const { getByLabelText, queryByLabelText } = render(
      <TrainingListItemActions {...baseProps} isCompleted />,
    );

    expect(getByLabelText("Completed")).toBeTruthy();
    expect(queryByLabelText("Finish exercise")).toBeNull();
  });

  it("names the check button of a row completed as too hard", () => {
    const { getByLabelText } = render(
      <TrainingListItemActions
        {...baseProps}
        isCompleted
        completedFeedback="TOO_HARD"
      />,
    );

    expect(getByLabelText("Completed: too hard")).toBeTruthy();
  });
});

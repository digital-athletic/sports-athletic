import { render } from "../../utils/testUtils";
import {
  TrainingListItemActions,
  type TrainingListItemActionsProps,
} from "./TrainingListItemActions";

describe("TrainingListItemActions: accessible names", () => {
  const baseProps: TrainingListItemActionsProps = {
    isTest: false,
    isCompleted: false,
    repsValue: 0,
    onStart: jest.fn(),
    onSkip: jest.fn(),
    testId: "row",
  };

  it("names the start button of a pending row Start exercise", () => {
    const { getByLabelText, queryByLabelText } = render(
      <TrainingListItemActions {...baseProps} />,
    );

    expect(getByLabelText("Start exercise")).toBeTruthy();
    expect(queryByLabelText("Completed")).toBeNull();
  });

  it("names the check button of a completed row Completed", () => {
    const { getByLabelText, queryByLabelText } = render(
      <TrainingListItemActions {...baseProps} isCompleted />,
    );

    expect(getByLabelText("Completed")).toBeTruthy();
    expect(queryByLabelText("Start exercise")).toBeNull();
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

  it("hides the skip button for test rows", () => {
    const { queryByLabelText } = render(
      <TrainingListItemActions {...baseProps} isTest />,
    );

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });

  it("hides the skip button once a row is completed", () => {
    const { queryByLabelText } = render(
      <TrainingListItemActions {...baseProps} isCompleted />,
    );

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });

  it("shows the saved reps count for a completed test row", () => {
    const { getByText } = render(
      <TrainingListItemActions
        {...baseProps}
        isTest
        isCompleted
        repsValue={8}
      />,
    );

    expect(getByText("8 repetitions")).toBeTruthy();
  });
});

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
    testId: "row",
  };

  it("names the start button of a pending row Start exercise", async () => {
    const { getByLabelText, queryByLabelText } = await render(
      <TrainingListItemActions {...baseProps} />,
    );

    expect(getByLabelText("Start exercise")).toBeTruthy();
    expect(queryByLabelText("Completed")).toBeNull();
  });

  it("names the check button of a completed row Completed", async () => {
    const { getByLabelText, queryByLabelText } = await render(
      <TrainingListItemActions {...baseProps} isCompleted />,
    );

    expect(getByLabelText("Completed")).toBeTruthy();
    expect(queryByLabelText("Start exercise")).toBeNull();
  });

  it("names the check button of a row completed as too hard", async () => {
    const { getByLabelText } = await render(
      <TrainingListItemActions
        {...baseProps}
        isCompleted
        completedFeedback="TOO_HARD"
      />,
    );

    expect(getByLabelText("Completed: too hard")).toBeTruthy();
  });

  it("shows no skip button on a pending row", async () => {
    const { queryByLabelText } = await render(
      <TrainingListItemActions {...baseProps} />,
    );

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });

  it("shows the saved reps count for a completed test row", async () => {
    const { getByText } = await render(
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

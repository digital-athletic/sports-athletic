import { type ReactNode } from "react";
import { act, fireEvent, render } from "../../utils/testUtils";
import { type ListRow } from "./hooks/useTrainingListRows";
import { TrainingExerciseSheet } from "./TrainingExerciseSheet";

jest.mock("@expo/ui", () => ({
  BottomSheet: ({
    isPresented,
    children,
  }: {
    isPresented: boolean;
    children?: ReactNode;
  }) => (isPresented ? children : null),
  RNHostView: ({ children }: { children: ReactNode }) => children,
}));

// A minimal pending, non-test checklist row, e.g. a squat at index 0.
const generateChecklistRow = (overrides: Partial<ListRow> = {}): ListRow => ({
  index: 0,
  exerciseId: "squat",
  displayName: "Squat",
  isTest: false,
  isLastInSet: true,
  isFeedbackSkill: false,
  completed: false,
  ...overrides,
});

describe("TrainingExerciseSheet", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when no row is active", () => {
    const { queryByTestId } = render(
      <TrainingExerciseSheet
        row={null}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(queryByTestId("training-list-sheet-continue")).toBeNull();
  });

  it("disables Continue until a timed row's countdown finishes, then completes", () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId } = render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        duration={2}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />,
    );

    const continueButton = getByTestId("training-list-sheet-continue");

    fireEvent.press(continueButton);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.press(continueButton);
    expect(onComplete).toHaveBeenCalledWith();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("enables Continue immediately for an open-ended row", () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId } = render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.press(getByTestId("training-list-sheet-continue"));

    expect(onComplete).toHaveBeenCalledWith();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows the reps input for a strength-test row and saves through onSubmitReps", () => {
    const onSubmitReps = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId, queryByTestId } = render(
      <TrainingExerciseSheet
        row={generateChecklistRow({ isTest: true })}
        duration={undefined}
        isScreenFocused
        repsValue={8}
        onChangeReps={jest.fn()}
        onSubmitReps={onSubmitReps}
        onComplete={jest.fn()}
        onDismiss={onDismiss}
      />,
    );

    expect(queryByTestId("training-list-sheet-continue")).toBeNull();

    fireEvent.press(getByTestId("training-list-sheet-reps-save"));

    expect(onSubmitReps).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows the too-easy/succeeded/too-hard choice after Continue on a feedback-eligible row", () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId, queryByTestId } = render(
      <TrainingExerciseSheet
        row={generateChecklistRow({
          isFeedbackSkill: true,
          isLastInSet: true,
        })}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.press(getByTestId("training-list-sheet-continue"));
    expect(queryByTestId("training-list-sheet-continue")).toBeNull();

    fireEvent.press(getByTestId("training-list-sheet-too-hard"));

    expect(onComplete).toHaveBeenCalledWith("TOO_HARD");
    expect(onDismiss).toHaveBeenCalled();
  });
});

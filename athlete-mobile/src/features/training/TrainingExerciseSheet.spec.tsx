import { type ReactNode } from "react";
import { act, fireEvent, render } from "../../utils/testUtils";
import { type ListRow } from "./hooks/useTrainingListRows";
import { TrainingExerciseSheet } from "./TrainingExerciseSheet";

// A real sheet keeps its children while it animates closed, so the mock
// renders them regardless of isPresented.
jest.mock("@expo/ui", () => ({
  BottomSheet: ({ children }: { children?: ReactNode }) => children,
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

  it("renders nothing when no row is active", async () => {
    const { queryByTestId } = await render(
      <TrainingExerciseSheet
        row={null}
        isPresented={false}
        sessionKey={1}
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

  it("keeps showing the last row while the sheet animates closed", async () => {
    const { getByText } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented={false}
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(getByText("Squat")).toBeTruthy();
  });

  it("disables Continue until a timed row's countdown finishes, then completes", async () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={1}
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

    await fireEvent.press(continueButton);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(2000);
    });

    await fireEvent.press(continueButton);
    expect(onComplete).toHaveBeenCalledWith();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("enables Continue immediately for an open-ended row", async () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-continue"));

    expect(onComplete).toHaveBeenCalledWith();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows the reps input for a strength-test row and saves through onSubmitReps", async () => {
    const onSubmitReps = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow({ isTest: true })}
        isPresented
        sessionKey={1}
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

    await fireEvent.press(getByTestId("training-list-sheet-reps-save"));

    expect(onSubmitReps).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows the too-easy/succeeded/too-hard choice after Continue on a feedback-eligible row", async () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow({
          isFeedbackSkill: true,
          isLastInSet: true,
        })}
        isPresented
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-continue"));
    expect(queryByTestId("training-list-sheet-continue")).toBeNull();

    await fireEvent.press(getByTestId("training-list-sheet-too-hard"));

    expect(onComplete).toHaveBeenCalledWith("TOO_HARD");
    expect(onDismiss).toHaveBeenCalled();
  });
});

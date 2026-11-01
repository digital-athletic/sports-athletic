import { type ReactNode } from "react";
import { act, fireEvent, render } from "../../utils/testUtils";
import { type ListRow } from "./hooks/useTrainingListRows";
import {
  TrainingExerciseSheet,
  type TrainingExerciseSheetProps,
} from "./TrainingExerciseSheet";
import { type SheetRest, type SheetRestControl } from "./utils/checklistRest";

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

  it("shows a large timer for a timed row and a small one for an open-ended row", async () => {
    const { getByTestId, rerender } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={1}
        duration={30}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(getByTestId("training-list-sheet-timer")).toHaveStyle({
      fontSize: 32,
    });

    await rerender(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={2}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(getByTestId("training-list-sheet-timer")).toHaveStyle({
      fontSize: 16,
    });
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

// A planned 60 second rest, e.g. { duration: 60 }.
const generateSheetRest = (overrides: Partial<SheetRest> = {}): SheetRest => ({
  duration: 60,
  ...overrides,
});

// The rest control the props hook hands to the sheet, e.g.
// { plan: generateSheetRest(), onStart: jest.fn(), onEnd: jest.fn() }.
const generateRestControl = (
  overrides: Partial<SheetRestControl> = {},
): SheetRestControl => ({
  plan: generateSheetRest(),
  onStart: jest.fn(),
  onEnd: jest.fn(),
  ...overrides,
});

describe("TrainingExerciseSheet: rest after a set", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderSheetWithRest = (
    overrides: Partial<TrainingExerciseSheetProps> = {},
  ) =>
    render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        repsValue={0}
        rest={generateRestControl()}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
        {...overrides}
      />,
    );

  it("shows the planned rest after Continue and keeps the sheet open", async () => {
    const onComplete = jest.fn();
    const onDismiss = jest.fn();
    const onStart = jest.fn();
    const { getByTestId, getByText } = await renderSheetWithRest({
      rest: generateRestControl({ onStart }),
      onComplete,
      onDismiss,
    });

    await fireEvent.press(getByTestId("training-list-sheet-continue"));

    expect(onComplete).toHaveBeenCalledWith();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
    expect(getByText("01:00")).toBeTruthy();
  });

  it("counts the rest down", async () => {
    const { getByTestId } = await renderSheetWithRest();

    await fireEvent.press(getByTestId("training-list-sheet-continue"));
    await act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(getByTestId("training-list-sheet-rest-timer")).toHaveTextContent(
      "00:50",
    );
  });

  it("ends the rest as skipped and closes the sheet on skip", async () => {
    const onRestEnd = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await renderSheetWithRest({
      rest: generateRestControl({ onEnd: onRestEnd }),
      onDismiss,
    });

    await fireEvent.press(getByTestId("training-list-sheet-continue"));
    await fireEvent.press(getByTestId("training-list-sheet-rest-skip"));

    expect(onRestEnd).toHaveBeenCalledWith(true);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("ends the rest as completed and closes the sheet when the countdown runs out", async () => {
    const onRestEnd = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await renderSheetWithRest({
      rest: generateRestControl({ onEnd: onRestEnd }),
      onDismiss,
    });

    await fireEvent.press(getByTestId("training-list-sheet-continue"));
    await act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(onRestEnd).toHaveBeenCalledWith(false);
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows the rest after the athlete picks a feedback", async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await renderSheetWithRest({
      row: generateChecklistRow({ isFeedbackSkill: true, isLastInSet: true }),
      onDismiss,
    });

    await fireEvent.press(getByTestId("training-list-sheet-continue"));
    await fireEvent.press(getByTestId("training-list-sheet-checkmark"));

    expect(onDismiss).not.toHaveBeenCalled();
    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
  });

  it("shows the rest after the athlete saves the reps of a strength test set", async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await renderSheetWithRest({
      row: generateChecklistRow({ isTest: true }),
      repsValue: 8,
      onDismiss,
    });

    await fireEvent.press(getByTestId("training-list-sheet-reps-save"));

    expect(onDismiss).not.toHaveBeenCalled();
    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
  });
});

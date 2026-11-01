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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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
        onSkip={jest.fn()}
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

// A 60 second rest before the second of three bench press sets, e.g.
// { duration: 60, nextSet: { displayName: "Bench Press", label: "2 of 3 · each 20.00 kg" } }.
const generateSheetRest = (overrides: Partial<SheetRest> = {}): SheetRest => ({
  duration: 60,
  nextSet: {
    exerciseId: "bench",
    displayName: "Bench Press",
    label: "2 of 3 · each 20.00 kg",
  },
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
        onSkip={jest.fn()}
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

  it("previews the next set with its name and set details", async () => {
    const { getByTestId } = await renderSheetWithRest();

    await fireEvent.press(getByTestId("training-list-sheet-continue"));

    const preview = getByTestId("training-list-sheet-next-set");
    expect(preview).toHaveTextContent(/Bench Press/);
    expect(preview).toHaveTextContent(/2 of 3 · each 20\.00 kg/);
  });

  it("shows the rest without a preview after the last set of the session", async () => {
    const { getByTestId, queryByTestId } = await renderSheetWithRest({
      rest: generateRestControl({
        plan: generateSheetRest({ nextSet: undefined }),
      }),
    });

    await fireEvent.press(getByTestId("training-list-sheet-continue"));

    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
    expect(queryByTestId("training-list-sheet-next-set")).toBeNull();
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

  it("closes the sheet without starting the rest when the athlete skips the set", async () => {
    const onStart = jest.fn();
    const onSkip = jest.fn();
    const onDismiss = jest.fn();
    const { getByLabelText, queryByTestId } = await renderSheetWithRest({
      rest: generateRestControl({ onStart }),
      onSkip,
      onDismiss,
    });

    await fireEvent.press(getByLabelText("Skip exercise"));

    expect(onSkip).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
    expect(queryByTestId("training-list-sheet-rest")).toBeNull();
  });
});

describe("TrainingExerciseSheet: skip button", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the skip button below the continue button", async () => {
    const { getAllByRole } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        onSkip={jest.fn()}
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    const buttonIds = getAllByRole("button").map(
      (button) => button.props.testID,
    );

    expect(buttonIds).toEqual([
      "training-list-sheet-continue",
      "training-list-sheet-skip",
    ]);
  });

  it("skips and closes the sheet while the countdown still runs", async () => {
    const onSkip = jest.fn();
    const onComplete = jest.fn();
    const onDismiss = jest.fn();

    const { getByTestId, getByLabelText } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow()}
        isPresented
        sessionKey={1}
        duration={30}
        isScreenFocused
        onSkip={onSkip}
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={onComplete}
        onDismiss={onDismiss}
      />,
    );

    expect(getByTestId("training-list-sheet-continue")).toBeDisabled();

    await fireEvent.press(getByLabelText("Skip exercise"));

    expect(onSkip).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows no skip button on the feedback step", async () => {
    const { getByTestId, queryByLabelText } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow({ isFeedbackSkill: true })}
        isPresented
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        onSkip={jest.fn()}
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-continue"));

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });

  it("shows no skip button for a strength test row", async () => {
    const { queryByLabelText } = await render(
      <TrainingExerciseSheet
        row={generateChecklistRow({ isTest: true })}
        isPresented
        sessionKey={1}
        duration={undefined}
        isScreenFocused
        onSkip={jest.fn()}
        repsValue={0}
        onChangeReps={jest.fn()}
        onSubmitReps={jest.fn()}
        onComplete={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });
});

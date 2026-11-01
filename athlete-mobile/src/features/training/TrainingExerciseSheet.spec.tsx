import { generateChecklistRow } from "@test/factories/checklistRow";
import { type ReactNode } from "react";
import { act, fireEvent, render } from "../../utils/testUtils";
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

// Props of an open sheet on an open ended squat set, e.g.
// generateSheetProps({ duration: 30 }) shows a 30 second countdown.
const generateSheetProps = (
  overrides: Partial<TrainingExerciseSheetProps> = {},
): TrainingExerciseSheetProps => ({
  row: generateChecklistRow({ displayName: "Squat" }),
  isPresented: true,
  sessionKey: 1,
  duration: undefined,
  isScreenFocused: true,
  repsValue: 0,
  onChangeReps: jest.fn(),
  onSubmitReps: jest.fn(),
  onComplete: jest.fn(),
  onSkip: jest.fn(),
  onNext: jest.fn(),
  onDismiss: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("TrainingExerciseSheet: heading", () => {
  it("renders nothing when no row is active", async () => {
    const { queryByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({ row: null, isPresented: false })}
      />,
    );

    expect(queryByTestId("training-list-sheet-next")).toBeNull();
  });

  it("keeps showing the last row while the sheet animates closed", async () => {
    const { getByText } = await render(
      <TrainingExerciseSheet {...generateSheetProps({ isPresented: false })} />,
    );

    expect(getByText("Squat")).toBeTruthy();
  });

  it("shows the label of the set under the exercise name", async () => {
    const { getByText } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ setLabel: "2 of 3 · 10 repetitions" }),
        })}
      />,
    );

    expect(getByText("2 of 3 · 10 repetitions")).toBeTruthy();
  });

  it("shows a large timer for a timed row and a small one for an open ended row", async () => {
    const { getByTestId, rerender } = await render(
      <TrainingExerciseSheet {...generateSheetProps({ duration: 30 })} />,
    );

    expect(getByTestId("training-list-sheet-timer")).toHaveStyle({
      fontSize: 32,
    });

    await rerender(
      <TrainingExerciseSheet {...generateSheetProps({ sessionKey: 2 })} />,
    );

    expect(getByTestId("training-list-sheet-timer")).toHaveStyle({
      fontSize: 16,
    });
  });
});

describe("TrainingExerciseSheet: Next", () => {
  it("names the button Next", async () => {
    const { getByText } = await render(
      <TrainingExerciseSheet {...generateSheetProps()} />,
    );

    expect(getByText("Next")).toBeTruthy();
  });

  it("completes the set, then moves to the next one without dismissing", async () => {
    const onComplete = jest.fn();
    const onNext = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({ onComplete, onNext, onDismiss })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(onComplete).toHaveBeenCalledWith();
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.invocationCallOrder[0]).toBeLessThan(
      onNext.mock.invocationCallOrder[0],
    );
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("disables Next until a timed row's countdown finishes", async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({ duration: 2, onComplete })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));
    expect(onComplete).not.toHaveBeenCalled();

    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(onComplete).toHaveBeenCalledWith();
  });

  it("shows the reps input for a strength test row and saves through onSubmitReps", async () => {
    const onSubmitReps = jest.fn();
    const onDismiss = jest.fn();
    const onNext = jest.fn();
    const { getByTestId, queryByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isTest: true }),
          repsValue: 8,
          onSubmitReps,
          onNext,
          onDismiss,
        })}
      />,
    );

    expect(queryByTestId("training-list-sheet-next")).toBeNull();

    await fireEvent.press(getByTestId("training-list-sheet-reps-save"));

    expect(onSubmitReps).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});

describe("TrainingExerciseSheet: feedback", () => {
  it("shows the too easy, succeeded and too hard choice after Next on the last set", async () => {
    const onComplete = jest.fn();
    const { getByTestId, queryByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isFeedbackSkill: true }),
          onComplete,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(queryByTestId("training-list-sheet-next")).toBeNull();
    expect(getByTestId("training-list-sheet-too-hard")).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("completes an earlier set of a feedback exercise without asking feedback", async () => {
    const onComplete = jest.fn();
    const onNext = jest.fn();
    const { getByTestId, queryByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isFeedbackSkill: true, isLastInSet: false }),
          onComplete,
          onNext,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(queryByTestId("training-list-sheet-too-hard")).toBeNull();
    expect(onComplete).toHaveBeenCalledWith();
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("completes with the chosen feedback and then moves to the next set", async () => {
    const onComplete = jest.fn();
    const onNext = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isFeedbackSkill: true }),
          onComplete,
          onNext,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));
    await fireEvent.press(getByTestId("training-list-sheet-too-hard"));

    expect(onComplete).toHaveBeenCalledWith("TOO_HARD");
    expect(onComplete.mock.invocationCallOrder[0]).toBeLessThan(
      onNext.mock.invocationCallOrder[0],
    );
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
  it("shows the planned rest after Next and keeps the sheet on the set", async () => {
    const onComplete = jest.fn();
    const onNext = jest.fn();
    const onStart = jest.fn();
    const { getByTestId, getByText } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          rest: generateRestControl({ onStart }),
          onComplete,
          onNext,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(onComplete).toHaveBeenCalledWith();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
    expect(getByText("01:00")).toBeTruthy();
  });

  it("counts the rest down", async () => {
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({ rest: generateRestControl() })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));
    await act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(getByTestId("training-list-sheet-rest-timer")).toHaveTextContent(
      "00:50",
    );
  });

  it("ends the rest as skipped and opens the next set on skip", async () => {
    const onRestEnd = jest.fn();
    const onNext = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          rest: generateRestControl({ onEnd: onRestEnd }),
          onNext,
          onDismiss,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));
    await fireEvent.press(getByTestId("training-list-sheet-rest-skip"));

    expect(onRestEnd).toHaveBeenCalledWith(true);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("ends the rest as completed and opens the next set when the countdown runs out", async () => {
    const onRestEnd = jest.fn();
    const onNext = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          rest: generateRestControl({ onEnd: onRestEnd }),
          onNext,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));
    await act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(onRestEnd).toHaveBeenCalledWith(false);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("previews the next set with its name and set details", async () => {
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({ rest: generateRestControl() })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    const preview = getByTestId("training-list-sheet-next-set");
    expect(preview).toHaveTextContent(/Bench Press/);
    expect(preview).toHaveTextContent(/2 of 3 · each 20\.00 kg/);
  });

  it("shows the rest without a preview after the last set of the session", async () => {
    const { getByTestId, queryByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          rest: generateRestControl({
            plan: generateSheetRest({ nextSet: undefined }),
          }),
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
    expect(queryByTestId("training-list-sheet-next-set")).toBeNull();
  });

  it("shows the rest after the athlete picks a feedback", async () => {
    const onNext = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isFeedbackSkill: true }),
          rest: generateRestControl(),
          onNext,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));
    await fireEvent.press(getByTestId("training-list-sheet-checkmark"));

    expect(onNext).not.toHaveBeenCalled();
    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
  });

  it("shows the rest after the athlete saves the reps of a strength test set", async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isTest: true }),
          repsValue: 8,
          rest: generateRestControl(),
          onDismiss,
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-reps-save"));

    expect(onDismiss).not.toHaveBeenCalled();
    expect(getByTestId("training-list-sheet-rest")).toBeTruthy();
  });

  it("moves on without starting the rest when the athlete skips the set", async () => {
    const onStart = jest.fn();
    const onSkip = jest.fn();
    const onNext = jest.fn();
    const { getByLabelText, queryByTestId } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          rest: generateRestControl({ onStart }),
          onSkip,
          onNext,
        })}
      />,
    );

    await fireEvent.press(getByLabelText("Skip exercise"));

    expect(onSkip).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    expect(queryByTestId("training-list-sheet-rest")).toBeNull();
  });
});

describe("TrainingExerciseSheet: skip button", () => {
  it("shows the skip button below the Next button", async () => {
    const { getAllByRole } = await render(
      <TrainingExerciseSheet {...generateSheetProps()} />,
    );

    const buttonIds = getAllByRole("button").map(
      (button) => button.props.testID,
    );

    expect(buttonIds).toEqual([
      "training-list-sheet-next",
      "training-list-sheet-skip",
    ]);
  });

  it("skips the set and moves on while the countdown still runs", async () => {
    const onSkip = jest.fn();
    const onComplete = jest.fn();
    const onNext = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId, getByLabelText } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          duration: 30,
          onSkip,
          onComplete,
          onNext,
          onDismiss,
        })}
      />,
    );

    expect(getByTestId("training-list-sheet-next")).toBeDisabled();

    await fireEvent.press(getByLabelText("Skip exercise"));

    expect(onSkip).toHaveBeenCalled();
    expect(onSkip.mock.invocationCallOrder[0]).toBeLessThan(
      onNext.mock.invocationCallOrder[0],
    );
    expect(onComplete).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("shows no skip button on the feedback step", async () => {
    const { getByTestId, queryByLabelText } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({
          row: generateChecklistRow({ isFeedbackSkill: true }),
        })}
      />,
    );

    await fireEvent.press(getByTestId("training-list-sheet-next"));

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });

  it("shows no skip button for a strength test row", async () => {
    const { queryByLabelText } = await render(
      <TrainingExerciseSheet
        {...generateSheetProps({ row: generateChecklistRow({ isTest: true }) })}
      />,
    );

    expect(queryByLabelText("Skip exercise")).toBeNull();
  });
});

import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { createExercise } from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { generateChecklistEntry } from "@test/factories/checklistEntry";
import { generateChecklistRow } from "@test/factories/checklistRow";
import { useTrainingExerciseSheetProps } from "./useTrainingExerciseSheetProps";

// The entry whose first open set is the row, e.g. row index 2 gives
// { key: 2, firstOpenSetIndex: 2 }, so Start opens that row's set.
const generateEntryStartingAt = (row: ListRow) =>
  generateChecklistEntry({
    key: row.index,
    exerciseId: row.exerciseId,
    firstOpenSetIndex: row.index,
  });

const startRowWithSkill = async (skill: string) => {
  const rows = [generateChecklistRow()];
  const exerciseList = [createExercise({ skill, duration: 30 })];

  const { result } = await renderHook(() =>
    useTrainingExerciseSheetProps({
      rows,
      exerciseList,
      repsDraft: {},
      timing: { startExercise: jest.fn(), endExercise: jest.fn() },
      onChangeReps: jest.fn(),
      onSubmitReps: jest.fn(),
      onComplete: jest.fn(),
      onRestEnd: jest.fn(),
      onSkip: jest.fn(),
    }),
  );
  await act(() => {
    result.current.handleStart(generateEntryStartingAt(rows[0]));
  });
  return result.current.sheetProps;
};

describe("useTrainingExerciseSheetProps: start", () => {
  it("opens the first open set of the entry with the skill of that set", async () => {
    const startExercise = jest.fn();
    const rows = [
      generateChecklistRow({ index: 0, exerciseId: "squat" }),
      generateChecklistRow({ index: 2, exerciseId: "squat" }),
    ];
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps({
        rows,
        exerciseList: [
          createExercise({ exerciseId: "squat", completed: true }),
          createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
          createExercise({ exerciseId: "squat", skill: "SWR2" }),
        ],
        repsDraft: {},
        timing: { startExercise, endExercise: jest.fn() },
        onChangeReps: jest.fn(),
        onSubmitReps: jest.fn(),
        onComplete: jest.fn(),
        onRestEnd: jest.fn(),
        onSkip: jest.fn(),
      }),
    );

    await act(() => {
      result.current.handleStart(
        generateChecklistEntry({
          key: 0,
          exerciseId: "squat",
          firstOpenSetIndex: 2,
        }),
      );
    });

    expect(result.current.sheetProps.row?.index).toBe(2);
    expect(startExercise).toHaveBeenCalledWith("SWR2");
  });

  it("opens nothing when the entry has no open set", async () => {
    const startExercise = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps({
        rows: [generateChecklistRow()],
        exerciseList: [createExercise({ completed: true })],
        repsDraft: {},
        timing: { startExercise, endExercise: jest.fn() },
        onChangeReps: jest.fn(),
        onSubmitReps: jest.fn(),
        onComplete: jest.fn(),
        onRestEnd: jest.fn(),
        onSkip: jest.fn(),
      }),
    );

    await act(() => {
      result.current.handleStart(
        generateChecklistEntry({ completed: true, firstOpenSetIndex: null }),
      );
    });

    expect(result.current.sheetProps.isPresented).toBe(false);
    expect(startExercise).not.toHaveBeenCalled();
  });
});

describe("useTrainingExerciseSheetProps: skip", () => {
  it("skips the row whose sheet is open", async () => {
    const onSkip = jest.fn();
    const rows = [
      generateChecklistRow(),
      generateChecklistRow({ index: 1, exerciseId: "lunge" }),
    ];
    const exerciseList = [createExercise(), createExercise()];

    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps({
        rows,
        exerciseList,
        repsDraft: {},
        timing: { startExercise: jest.fn(), endExercise: jest.fn() },
        onChangeReps: jest.fn(),
        onSubmitReps: jest.fn(),
        onComplete: jest.fn(),
        onRestEnd: jest.fn(),
        onSkip,
      }),
    );
    await act(() => {
      result.current.handleStart(generateEntryStartingAt(rows[1]));
    });
    await act(() => {
      result.current.sheetProps.onSkip();
    });

    expect(onSkip).toHaveBeenCalledWith(rows[1]);
  });

  it("skips nothing once the sheet is closing", async () => {
    const onSkip = jest.fn();
    const rows = [generateChecklistRow()];

    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps({
        rows,
        exerciseList: [createExercise()],
        repsDraft: {},
        timing: { startExercise: jest.fn(), endExercise: jest.fn() },
        onChangeReps: jest.fn(),
        onSubmitReps: jest.fn(),
        onComplete: jest.fn(),
        onRestEnd: jest.fn(),
        onSkip,
      }),
    );
    await act(() => {
      result.current.handleStart(generateEntryStartingAt(rows[0]));
    });
    await act(() => {
      result.current.sheetProps.onDismiss();
    });
    await act(() => {
      result.current.sheetProps.onSkip();
    });

    expect(onSkip).not.toHaveBeenCalled();
  });
});

describe("useTrainingExerciseSheetProps: other sheet actions", () => {
  it("routes reps, completion, and dismiss to the row whose sheet is open", async () => {
    const onChangeReps = jest.fn();
    const onSubmitReps = jest.fn();
    const onComplete = jest.fn();
    const endExercise = jest.fn();
    const rows = [generateChecklistRow()];
    const exerciseList = [createExercise()];

    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps({
        rows,
        exerciseList,
        repsDraft: { 0: 8 },
        timing: { startExercise: jest.fn(), endExercise },
        onChangeReps,
        onSubmitReps,
        onComplete,
        onRestEnd: jest.fn(),
        onSkip: jest.fn(),
      }),
    );
    await act(() => {
      result.current.handleStart(generateEntryStartingAt(rows[0]));
    });
    await act(() => {
      result.current.sheetProps.onChangeReps("9");
      result.current.sheetProps.onSubmitReps();
      result.current.sheetProps.onComplete("TOO_EASY");
      result.current.sheetProps.onDismiss();
    });

    expect(onChangeReps).toHaveBeenCalledWith(0, "9");
    expect(onSubmitReps).toHaveBeenCalledWith(rows[0]);
    expect(onComplete).toHaveBeenCalledWith(rows[0], "TOO_EASY");
    expect(endExercise).toHaveBeenCalled();
  });
});

describe("useTrainingExerciseSheetProps: countdown duration", () => {
  it("keeps the duration for a timed row", async () => {
    const sheetProps = await startRowWithSkill("SWR1");

    expect(sheetProps.duration).toBe(30);
  });

  it.each(["CARDIO_4", "CARDIO_5"])(
    "gives the endurance skill %s no countdown duration",
    async (skill) => {
      const sheetProps = await startRowWithSkill(skill);

      expect(sheetProps.duration).toBeUndefined();
    },
  );
});

describe("useTrainingExerciseSheetProps: rest after a set", () => {
  // Set list: squat set 1, a 45 second rest, squat set 2.
  const exerciseList = [
    createExercise({ exerciseId: "squat", set: [1, 2], repetition: 10 }),
    createExercise({ exerciseId: PAUSE_EXERCISE_ID, duration: 45 }),
    createExercise({ exerciseId: "squat", set: [2, 2], repetition: 10 }),
  ];
  const rows = [
    generateChecklistRow({ index: 0, displayName: "Squat" }),
    generateChecklistRow({
      index: 2,
      exerciseId: "squat",
      displayName: "Squat",
      nextSetLabel: "2 of 2 · 10 repetitions",
    }),
  ];

  const startSet = async (row: ListRow) => {
    const timing = { startExercise: jest.fn(), endExercise: jest.fn() };
    const onRestEnd = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps({
        rows,
        exerciseList,
        repsDraft: {},
        timing,
        onChangeReps: jest.fn(),
        onSubmitReps: jest.fn(),
        onComplete: jest.fn(),
        onRestEnd,
        onSkip: jest.fn(),
      }),
    );
    await act(() => {
      result.current.handleStart(generateEntryStartingAt(row));
    });
    return { result, timing, onRestEnd };
  };

  it("passes the planned rest and the next set to the sheet", async () => {
    const { result } = await startSet(rows[0]);

    expect(result.current.sheetProps.rest?.plan).toEqual({
      duration: 45,
      nextSet: {
        exerciseId: "squat",
        displayName: "Squat",
        label: "2 of 2 · 10 repetitions",
      },
    });
  });

  it("passes no rest for a set without a rest after it", async () => {
    const { result } = await startSet(rows[1]);

    expect(result.current.sheetProps.rest).toBeUndefined();
  });

  it("stops the exercise time when the rest starts", async () => {
    const { result, timing } = await startSet(rows[0]);

    await act(() => {
      result.current.sheetProps.rest?.onStart();
    });

    expect(timing.endExercise).toHaveBeenCalled();
  });

  it("records the rest outcome against the rest entry", async () => {
    const { result, onRestEnd } = await startSet(rows[0]);

    await act(() => {
      result.current.sheetProps.rest?.onStart();
    });
    await act(() => {
      result.current.sheetProps.rest?.onEnd(false);
      result.current.sheetProps.onDismiss();
    });

    expect(onRestEnd).toHaveBeenCalledTimes(1);
    expect(onRestEnd).toHaveBeenCalledWith(1, false);
  });

  it("records a rest as skipped when the athlete swipes the sheet away", async () => {
    const { result, onRestEnd } = await startSet(rows[0]);

    await act(() => {
      result.current.sheetProps.rest?.onStart();
    });
    await act(() => {
      result.current.sheetProps.onDismiss();
    });

    expect(onRestEnd).toHaveBeenCalledWith(1, true);
  });

  it("records no rest when the athlete completes the set but the rest never starts", async () => {
    const { result, onRestEnd } = await startSet(rows[0]);

    await act(() => {
      result.current.sheetProps.onComplete();
    });
    await act(() => {
      result.current.sheetProps.onDismiss();
    });

    expect(onRestEnd).not.toHaveBeenCalled();
  });

  it("records no rest when the athlete closes the sheet before Continue", async () => {
    const { result, onRestEnd } = await startSet(rows[0]);

    await act(() => {
      result.current.sheetProps.onDismiss();
    });

    expect(onRestEnd).not.toHaveBeenCalled();
  });
});

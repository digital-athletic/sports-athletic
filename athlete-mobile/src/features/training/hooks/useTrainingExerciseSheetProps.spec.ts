import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { useTrainingStore } from "@/features/training/trainingStore";
import {
  BASELINE_TRAINING_STATE,
  createExercise,
} from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { generateChecklistEntry } from "@test/factories/checklistEntry";
import { generateChecklistRow } from "@test/factories/checklistRow";
import { type ListRow } from "./useTrainingListRows";
import { useTrainingExerciseSheetProps } from "./useTrainingExerciseSheetProps";

// A superset of two exercises with rests between, e.g. at list indices
// 0 squat set 1, 1 rest, 2 lunge set 1, 3 rest, 4 squat set 2, 5 rest, 6 lunge set 2.
const generateSupersetList = () => [
  createExercise({ exerciseId: "squat", skill: "SWR1", set: [1, 2] }),
  createExercise({ exerciseId: "999999", skill: "SWR1" }),
  createExercise({ exerciseId: "lunge", skill: "SWR2", set: [1, 2] }),
  createExercise({ exerciseId: "999999", skill: "SWR2" }),
  createExercise({ exerciseId: "squat", skill: "SWR1", set: [2, 2] }),
  createExercise({ exerciseId: "999999", skill: "SWR1" }),
  createExercise({ exerciseId: "lunge", skill: "SWR2", set: [2, 2] }),
];

// Rows of the superset sets, e.g. [{ index: 0, exerciseId: "squat" }, { index: 2, ... }].
const generateSupersetRows = (): ListRow[] =>
  [
    [0, "squat"],
    [2, "lunge"],
    [4, "squat"],
    [6, "lunge"],
  ].map(([index, exerciseId]) =>
    generateChecklistRow({
      index: Number(index),
      exerciseId: String(exerciseId),
    }),
  );

// Stands in for the real completion: marks the row's set completed in the store.
const completeSetInStore = (row: ListRow) => {
  const list = useTrainingStore.getState().exerciseList ?? [];
  useTrainingStore.setState({
    exerciseList: list.map((exercise, index) =>
      index === row.index ? { ...exercise, completed: true } : exercise,
    ),
  });
};

type HookArgs = Parameters<typeof useTrainingExerciseSheetProps>[0];

// Hook arguments for the superset above with completion writing to the store,
// e.g. generateSheetHookArgs({ repsDraft: { 2: 8 } }) adds a reps draft.
const generateSheetHookArgs = (
  overrides: Partial<HookArgs> = {},
): HookArgs => ({
  rows: generateSupersetRows(),
  exerciseList: generateSupersetList(),
  repsDraft: {},
  timing: { startExercise: jest.fn(), endExercise: jest.fn() },
  onChangeReps: jest.fn(),
  onSubmitReps: jest.fn(),
  onComplete: completeSetInStore,
  onRestEnd: jest.fn(),
  onSkip: jest.fn(),
  ...overrides,
});

// The squat entry of the superset, with its first set open.
const squatEntry = generateChecklistEntry({
  key: 0,
  exerciseId: "squat",
  firstOpenSetIndex: 0,
});

beforeEach(() => {
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
  useTrainingStore.setState({ exerciseList: generateSupersetList() });
});

describe("useTrainingExerciseSheetProps: countdown duration", () => {
  it("keeps the duration for a timed row", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          exerciseList: [createExercise({ skill: "SWR1", duration: 30 })],
        }),
      ),
    );

    await act(() => result.current.handleStart(squatEntry));

    expect(result.current.sheetProps.duration).toBe(30);
  });

  it.each(["CARDIO_4", "CARDIO_5"])(
    "gives the endurance skill %s no countdown duration",
    async (skill) => {
      const { result } = await renderHook(() =>
        useTrainingExerciseSheetProps(
          generateSheetHookArgs({
            exerciseList: [createExercise({ skill, duration: 30 })],
          }),
        ),
      );

      await act(() => result.current.handleStart(squatEntry));

      expect(result.current.sheetProps.duration).toBeUndefined();
    },
  );
});

describe("useTrainingExerciseSheetProps: rest after a set", () => {
  // Set list: squat set 1, a 45 second rest, squat set 2.
  const generateRestList = () => [
    createExercise({ exerciseId: "squat", set: [1, 2], repetition: 10 }),
    createExercise({ exerciseId: PAUSE_EXERCISE_ID, duration: 45 }),
    createExercise({ exerciseId: "squat", set: [2, 2], repetition: 10 }),
  ];
  const rows = [
    generateChecklistRow({
      index: 0,
      exerciseId: "squat",
      displayName: "Squat",
    }),
    generateChecklistRow({
      index: 2,
      exerciseId: "squat",
      displayName: "Squat",
      nextSetLabel: "2 of 2 · 10 repetitions",
    }),
  ];
  // The squat entry with its first set open, e.g. Start opens list index 0.
  const firstSetEntry = generateChecklistEntry({
    key: 0,
    exerciseId: "squat",
    firstOpenSetIndex: 0,
  });

  beforeEach(() => {
    useTrainingStore.setState({ exerciseList: generateRestList() });
  });

  it("passes the planned rest and the next set to the sheet", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({ rows, exerciseList: generateRestList() }),
      ),
    );
    await act(() => result.current.handleStart(firstSetEntry));

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
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({ rows, exerciseList: generateRestList() }),
      ),
    );
    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({
          key: 0,
          exerciseId: "squat",
          firstOpenSetIndex: 2,
        }),
      ),
    );

    expect(result.current.sheetProps.rest).toBeUndefined();
  });

  it("stops the exercise time when the rest starts", async () => {
    const timing = { startExercise: jest.fn(), endExercise: jest.fn() };
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          rows,
          exerciseList: generateRestList(),
          timing,
        }),
      ),
    );
    await act(() => result.current.handleStart(firstSetEntry));

    await act(() => result.current.sheetProps.rest?.onStart());

    expect(timing.endExercise).toHaveBeenCalled();
  });

  it("records the rest outcome against the rest entry, then opens the set the preview showed", async () => {
    const onRestEnd = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          rows,
          exerciseList: generateRestList(),
          onRestEnd,
        }),
      ),
    );
    await act(() => result.current.handleStart(firstSetEntry));
    const previewedSet = result.current.sheetProps.rest?.plan.nextSet;

    await act(() => {
      result.current.sheetProps.onComplete();
      result.current.sheetProps.rest?.onStart();
    });
    await act(() => {
      result.current.sheetProps.rest?.onEnd(false);
      result.current.sheetProps.onNext();
    });

    expect(onRestEnd).toHaveBeenCalledTimes(1);
    expect(onRestEnd).toHaveBeenCalledWith(1, false);
    expect(previewedSet?.exerciseId).toBe("squat");
    expect(result.current.sheetProps.row?.index).toBe(2);
  });

  it("records a rest as skipped when the athlete swipes the sheet away", async () => {
    const onRestEnd = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          rows,
          exerciseList: generateRestList(),
          onRestEnd,
        }),
      ),
    );
    await act(() => result.current.handleStart(firstSetEntry));

    await act(() => result.current.sheetProps.rest?.onStart());
    await act(() => result.current.sheetProps.onDismiss());

    expect(onRestEnd).toHaveBeenCalledWith(1, true);
  });

  it("records no rest when the athlete completes the set but the rest never starts", async () => {
    const onRestEnd = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          rows,
          exerciseList: generateRestList(),
          onRestEnd,
        }),
      ),
    );
    await act(() => result.current.handleStart(firstSetEntry));

    await act(() => result.current.sheetProps.onComplete());
    await act(() => result.current.sheetProps.onDismiss());

    expect(onRestEnd).not.toHaveBeenCalled();
  });

  it("records no rest when the athlete closes the sheet before Next", async () => {
    const onRestEnd = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          rows,
          exerciseList: generateRestList(),
          onRestEnd,
        }),
      ),
    );
    await act(() => result.current.handleStart(firstSetEntry));

    await act(() => result.current.sheetProps.onDismiss());

    expect(onRestEnd).not.toHaveBeenCalled();
  });
});

describe("useTrainingExerciseSheetProps: start", () => {
  it("opens the first open set of the entry", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(generateSheetHookArgs()),
    );

    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({
          key: 2,
          exerciseId: "lunge",
          firstOpenSetIndex: 6,
        }),
      ),
    );

    expect(result.current.sheetProps.isPresented).toBe(true);
    expect(result.current.sheetProps.row?.index).toBe(6);
  });

  it("starts the timing with the skill of the opened set", async () => {
    const startExercise = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          timing: { startExercise, endExercise: jest.fn() },
        }),
      ),
    );

    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({
          key: 2,
          exerciseId: "lunge",
          firstOpenSetIndex: 2,
        }),
      ),
    );

    expect(startExercise).toHaveBeenCalledWith("SWR2");
  });

  it("opens nothing when the entry has no open set", async () => {
    const startExercise = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          timing: { startExercise, endExercise: jest.fn() },
        }),
      ),
    );

    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({ completed: true, firstOpenSetIndex: null }),
      ),
    );

    expect(result.current.sheetProps.isPresented).toBe(false);
    expect(startExercise).not.toHaveBeenCalled();
  });
});

describe("useTrainingExerciseSheetProps: next", () => {
  it("alternates between the exercises of a superset", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(generateSheetHookArgs()),
    );
    await act(() => result.current.handleStart(squatEntry));
    const visitedIndices = [result.current.sheetProps.row?.index];

    for (let step = 0; step < 3; step += 1) {
      await act(() => {
        result.current.sheetProps.onComplete();
        result.current.sheetProps.onNext();
      });
      visitedIndices.push(result.current.sheetProps.row?.index);
    }

    expect(visitedIndices).toEqual([0, 2, 4, 6]);
  });

  it("opens the first open set of the workout, as the step by step view does", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(generateSheetHookArgs()),
    );
    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({
          key: 2,
          exerciseId: "lunge",
          firstOpenSetIndex: 2,
        }),
      ),
    );

    await act(() => {
      result.current.sheetProps.onComplete();
      result.current.sheetProps.onNext();
    });

    expect(result.current.sheetProps.row?.index).toBe(0);
  });

  it("ends the current exercise and starts the next one with its skill", async () => {
    const startExercise = jest.fn();
    const endExercise = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({ timing: { startExercise, endExercise } }),
      ),
    );
    await act(() => result.current.handleStart(squatEntry));
    startExercise.mockClear();

    await act(() => {
      result.current.sheetProps.onComplete();
      result.current.sheetProps.onNext();
    });

    expect(endExercise).toHaveBeenCalledTimes(1);
    expect(startExercise).toHaveBeenCalledTimes(1);
    expect(startExercise).toHaveBeenCalledWith("SWR2");
  });

  it("opens a new sheet session for the next set", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(generateSheetHookArgs()),
    );
    await act(() => result.current.handleStart(squatEntry));
    const firstSession = result.current.sheetProps.sessionKey;

    await act(() => {
      result.current.sheetProps.onComplete();
      result.current.sheetProps.onNext();
    });

    expect(result.current.sheetProps.sessionKey).toBe(firstSession + 1);
  });

  it("keeps the session of the next set when Next fires twice from one render", async () => {
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(generateSheetHookArgs()),
    );
    await act(() => result.current.handleStart(squatEntry));
    const firstSession = result.current.sheetProps.sessionKey;
    const { onComplete, onNext } = result.current.sheetProps;

    await act(() => {
      onComplete();
      onNext();
      onNext();
    });

    expect(result.current.sheetProps.row?.index).toBe(2);
    expect(result.current.sheetProps.sessionKey).toBe(firstSession + 1);
  });

  it("closes the sheet when no open set remains", async () => {
    const startExercise = jest.fn();
    const endExercise = jest.fn();
    useTrainingStore.setState({
      exerciseList: generateSupersetList().map((exercise, index) =>
        index === 6 ? exercise : { ...exercise, completed: true },
      ),
    });
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({ timing: { startExercise, endExercise } }),
      ),
    );
    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({
          key: 2,
          exerciseId: "lunge",
          firstOpenSetIndex: 6,
        }),
      ),
    );
    startExercise.mockClear();

    await act(() => {
      result.current.sheetProps.onComplete();
      result.current.sheetProps.onNext();
    });

    expect(result.current.sheetProps.isPresented).toBe(false);
    expect(endExercise).toHaveBeenCalledTimes(1);
    expect(startExercise).not.toHaveBeenCalled();
  });
});

describe("useTrainingExerciseSheetProps: reps and dismiss", () => {
  it("routes reps, completion and skip to the set the sheet shows", async () => {
    const onChangeReps = jest.fn();
    const onSubmitReps = jest.fn();
    const onComplete = jest.fn();
    const onSkip = jest.fn();
    const rows = generateSupersetRows();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          rows,
          repsDraft: { 2: 8 },
          onChangeReps,
          onSubmitReps,
          onComplete,
          onSkip,
        }),
      ),
    );
    await act(() =>
      result.current.handleStart(
        generateChecklistEntry({
          key: 2,
          exerciseId: "lunge",
          firstOpenSetIndex: 2,
        }),
      ),
    );

    await act(() => {
      result.current.sheetProps.onChangeReps("12");
      result.current.sheetProps.onSubmitReps();
      result.current.sheetProps.onComplete("TOO_EASY");
      result.current.sheetProps.onSkip();
    });

    expect(result.current.sheetProps.repsValue).toBe(8);
    expect(onChangeReps).toHaveBeenCalledWith(2, "12");
    expect(onSubmitReps).toHaveBeenCalledWith(rows[1]);
    expect(onComplete).toHaveBeenCalledWith(rows[1], "TOO_EASY");
    expect(onSkip).toHaveBeenCalledWith(rows[1]);
  });

  it("ignores sheet actions after the sheet is dismissed", async () => {
    const onChangeReps = jest.fn();
    const onSubmitReps = jest.fn();
    const onSkip = jest.fn();
    const endExercise = jest.fn();
    const { result } = await renderHook(() =>
      useTrainingExerciseSheetProps(
        generateSheetHookArgs({
          timing: { startExercise: jest.fn(), endExercise },
          onChangeReps,
          onSubmitReps,
          onSkip,
        }),
      ),
    );
    await act(() => result.current.handleStart(squatEntry));

    await act(() => result.current.sheetProps.onDismiss());
    await act(() => {
      result.current.sheetProps.onChangeReps("12");
      result.current.sheetProps.onSubmitReps();
      result.current.sheetProps.onSkip();
      result.current.sheetProps.onNext();
    });

    expect(result.current.sheetProps.isPresented).toBe(false);
    expect(endExercise).toHaveBeenCalledTimes(1);
    expect(onChangeReps).not.toHaveBeenCalled();
    expect(onSubmitReps).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();
  });
});

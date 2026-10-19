import { Alert } from "@/common/Alert";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { type FocusArea } from "@/features/training/models/Training";
import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE as SHARED_BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { type MaxValuesType } from "@/schemas/user.schema";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { act, renderHook } from "@testing-library/react-native";
import { useExerciseProgression } from "./useExerciseProgression";

// Immer freezes produced store state objects, so `jest.spyOn` cannot patch an
// action property on a live snapshot in place. Instead, capture the true
// original implementations once, then have each test install a fresh
// jest.fn() wrapper via `setState` (which assigns a brand new, unfrozen
// top-level state object) that delegates to the captured original.
const ORIGINAL_ADD_PAUSE_TIME = useTrainingStore.getState().addPauseTime;
const ORIGINAL_ADD_SKILL_TIME = useTrainingStore.getState().addSkillTime;
const ORIGINAL_MARK_EXERCISE_COMPLETED =
  useTrainingStore.getState().markExerciseCompleted;

function spyOnAddPauseTime() {
  const spy = jest.fn((pauseTime: number) =>
    ORIGINAL_ADD_PAUSE_TIME(pauseTime),
  );
  useTrainingStore.setState({ addPauseTime: spy });
  return spy;
}

function spyOnAddSkillTime() {
  const spy = jest.fn((focusArea: FocusArea, skillTime: number) =>
    ORIGINAL_ADD_SKILL_TIME(focusArea, skillTime),
  );
  useTrainingStore.setState({ addSkillTime: spy });
  return spy;
}

function spyOnMarkExerciseCompleted() {
  const spy = jest.fn((index: number) =>
    ORIGINAL_MARK_EXERCISE_COMPLETED(index),
  );
  useTrainingStore.setState({ markExerciseCompleted: spy });
  return spy;
}

// Real BARBELL-equipment exercise id from assets/data/generator/Exercises.json
// ("einbeiniges Kreuzheben mit LH li und re GStabi", tags include EQ_BARBELL).
const BARBELL_EXERCISE_ID = "16";

const mockSaveExerciseAndBranchData = jest.fn();
const mockSaveRepsInput = jest.fn();
const mockCompletionHandleFeedback = jest.fn();
const mockCompletionHandleExerciseSkipped = jest.fn();

jest.mock("@/features/training/hooks/useExerciseCompletion", () => ({
  useExerciseCompletion: () => ({
    saveExerciseAndBranchData: mockSaveExerciseAndBranchData,
    saveRepsInput: mockSaveRepsInput,
    handleFeedback: mockCompletionHandleFeedback,
    handleExerciseSkipped: mockCompletionHandleExerciseSkipped,
  }),
}));

const mockFinishTraining = jest.fn();

jest.mock("@/features/training/hooks/useFinishTraining", () => ({
  useFinishTraining: () => ({
    finishTraining: mockFinishTraining,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: "en" },
  }),
}));

const createExercise = (
  overrides: Partial<UserExerciseDataType> = {},
): UserExerciseDataType =>
  ({
    exerciseId: "1",
    skill: "SWR1",
    feedback: { difficulty: null },
    skipped: false,
    ...overrides,
  }) as UserExerciseDataType;

// Restores the original store actions on reset so spies from earlier tests do not leak.
const BASELINE_TRAINING_STATE = {
  ...SHARED_BASELINE_TRAINING_STATE,
  addPauseTime: ORIGINAL_ADD_PAUSE_TIME,
  addSkillTime: ORIGINAL_ADD_SKILL_TIME,
  markExerciseCompleted: ORIGINAL_MARK_EXERCISE_COMPLETED,
};

const BASELINE_MAX_VALUES: MaxValuesType = {
  testAt: 0,
  verticalPush: {},
  verticalPull: {},
  horizontalPush: {},
  horizontalPull: {},
  hipHinge: {},
  kneeDominant: {},
  lowerBody: {},
} as unknown as MaxValuesType;

const seedUserStores = (extraTags: Record<string, string[]> = {}) => {
  useUserWorkoutStore.setState({
    workoutData: {
      sport: "OTHER_SPORT",
      tags: { POSITION: ["FIELD"], LEVEL: ["BEGINNER"], ...extraTags },
      seasonPhase: { type: null, endDate: "2026-01-01" },
      maxValues: BASELINE_MAX_VALUES,
    },
  });

  useUserProfileStore.setState({
    personalData: {
      username: "test",
      gender: "MALE",
      birthday: "1990-01-01",
    },
  });
};

// Controllable "current time" for Date.now(), driven explicitly per test step
// rather than via mockReturnValueOnce chains, because useRef's initializer
// argument is re-evaluated (and discarded) on every render, which would
// otherwise consume queued once-values non-deterministically.
let mockNow = 0;

beforeEach(() => {
  jest.spyOn(Alert, "alert");
});

describe("useExerciseProgression: advanceToNextExercise pause time accounting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 1_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: "2", skill: "SWR1" }),
        createExercise({ exerciseId: "3", skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("commits addPauseTime with the elapsed pause duration", () => {
    const addPauseTimeSpy = spyOnAddPauseTime();

    const { result } = renderHook(() => useExerciseProgression());

    mockNow = 1_000_000 + 5_000;
    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(addPauseTimeSpy).toHaveBeenCalledWith(5_000);
  });

  it("marks the current exercise completed so the pointer derives past it", () => {
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(useTrainingStore.getState().exerciseList?.[0]?.completed).toBe(true);
  });

  it("saves exercise/branch data via useExerciseCompletion before advancing", () => {
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(mockSaveExerciseAndBranchData).toHaveBeenCalledWith(0);
  });
});

describe("useExerciseProgression: advanceToNextExercise skill time accounting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 2_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "SWR1" }),
        createExercise({ exerciseId: "2", skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("commits addSkillTime with the mapped focus area and elapsed duration for a non pause exercise", () => {
    const addSkillTimeSpy = spyOnAddSkillTime();

    const { result } = renderHook(() => useExerciseProgression());

    mockNow = 2_000_000 + 3_000;
    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(addSkillTimeSpy).toHaveBeenCalledWith("SWR", 3_000);
  });
});

describe("useExerciseProgression: advanceToNextExercise training completion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 3_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
      activeTraining: { id: "training-1", type: "TEST_WORKOUT" },
    });

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("calls finishTraining(false, maxValues) when advancing past the last exercise", () => {
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise(BASELINE_MAX_VALUES);
    });

    expect(mockFinishTraining).toHaveBeenCalledWith(false, BASELINE_MAX_VALUES);
  });
});

describe("useExerciseProgression: barbell alert", () => {
  const buildState = (trainingType: string) => {
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: BARBELL_EXERCISE_ID, skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: trainingType },
    });

    seedUserStores();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 5_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows the barbell weight calculation alert for a TEST_WORKOUT whose next exercise carries barbell equipment", () => {
    buildState("TEST_WORKOUT");
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "training.active.weightCalculationAlert.title",
      "training.active.weightCalculationAlert.message",
      expect.any(Array),
    );
  });

  it("does not show the barbell alert for a non TEST_WORKOUT training type", () => {
    buildState("PLAN");
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("one shot: suppresses the barbell alert on a second advance after acknowledging it (fresh instance)", () => {
    buildState("TEST_WORKOUT");
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    act(() => {
      buttons[0].onPress();
    });

    act(() => {
      useTrainingStore.setState({
        exerciseList: [
          createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
          createExercise({ exerciseId: BARBELL_EXERCISE_ID, skill: "SWR1" }),
        ],
      });
    });

    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});

describe("useExerciseProgression: handleExerciseSkipped", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 6_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("marks isSkipped and calls the completion hook's handleExerciseSkipped for the current index", () => {
    // Single-item list: skipping the last exercise finishes the training
    // instead of advancing the index, so exerciseId is stable and the
    // id-keyed reset effect does not immediately flip isSkipped back off.
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = renderHook(() => useExerciseProgression());
    expect(result.current.isSkipped).toBe(false);

    act(() => {
      result.current.handleExerciseSkipped();
    });

    expect(result.current.isSkipped).toBe(true);
    expect(mockCompletionHandleExerciseSkipped).toHaveBeenCalledWith(0);
  });

  it("marks the exercise completed so the pointer derives to the next one", () => {
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "SWR1" }),
        createExercise({ exerciseId: "2", skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.handleExerciseSkipped();
    });

    expect(mockCompletionHandleExerciseSkipped).toHaveBeenCalledWith(0);
    expect(useTrainingStore.getState().exerciseList?.[0]?.completed).toBe(true);
    expect(mockSaveExerciseAndBranchData).not.toHaveBeenCalled();
  });

  it("resets isSkipped back to false once skipping advances to a new exercise id", () => {
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "SWR1" }),
        createExercise({ exerciseId: "2", skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.handleExerciseSkipped();
    });

    expect(result.current.isSkipped).toBe(false);
  });
});

describe("useExerciseProgression: handleAbortTraining", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 7_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [createExercise({ exerciseId: "1", skill: "SWR1" })],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows a confirmation alert and calls finishTraining(true) when the user confirms", () => {
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.handleAbortTraining();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "training.active.abort.question",
      "training.active.abort.explanation",
      expect.any(Array),
    );

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = buttons.find(
      (button: { text: string }) => button.text === "common.yes",
    );

    act(() => {
      confirmButton.onPress();
    });

    expect(mockFinishTraining).toHaveBeenCalledWith(true);
    expect(result.current.isAborted).toBe(true);
  });

  it("does not call finishTraining when the user declines", () => {
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.handleAbortTraining();
    });

    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    const declineButton = buttons.find(
      (button: { text: string }) => button.text === "common.no",
    );

    expect(declineButton.onPress).toBeUndefined();
    expect(mockFinishTraining).not.toHaveBeenCalled();
    expect(result.current.isAborted).toBe(false);
  });
});

describe("useExerciseProgression: interleaved call order in advanceToNextExercise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 8_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("orders save, then mark-completed, then pause commit, then alert checks for a pause exercise", () => {
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: BARBELL_EXERCISE_ID, skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "TEST_WORKOUT" },
    });
    seedUserStores();

    const addPauseTimeSpy = spyOnAddPauseTime();
    const markExerciseCompletedSpy = spyOnMarkExerciseCompleted();

    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    const saveOrder = mockSaveExerciseAndBranchData.mock.invocationCallOrder[0];
    const markCompletedOrder =
      markExerciseCompletedSpy.mock.invocationCallOrder[0];
    const pauseOrder = addPauseTimeSpy.mock.invocationCallOrder[0];
    const alertOrder = (Alert.alert as jest.Mock).mock.invocationCallOrder[0];

    expect(saveOrder).toBeLessThan(markCompletedOrder);
    expect(markCompletedOrder).toBeLessThan(pauseOrder);
    expect(pauseOrder).toBeLessThan(alertOrder);
  });

  it("orders save, then mark-completed, then skill commit for a non pause exercise", () => {
    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "SWR1" }),
        createExercise({ exerciseId: "2", skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });
    seedUserStores();

    const addSkillTimeSpy = spyOnAddSkillTime();
    const markExerciseCompletedSpy = spyOnMarkExerciseCompleted();

    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    const saveOrder = mockSaveExerciseAndBranchData.mock.invocationCallOrder[0];
    const markCompletedOrder =
      markExerciseCompletedSpy.mock.invocationCallOrder[0];
    const skillOrder = addSkillTimeSpy.mock.invocationCallOrder[0];

    expect(saveOrder).toBeLessThan(markCompletedOrder);
    expect(markCompletedOrder).toBeLessThan(skillOrder);
  });
});

describe("useExerciseProgression: pause timing after out-of-order completion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 9_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "SWR1" }),
        createExercise({ exerciseId: "2", skill: "SWR1", completed: true }),
        createExercise({ exerciseId: PAUSE_EXERCISE_ID }),
        createExercise({ exerciseId: "3", skill: "SWR1" }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts the pause timer for the true next exercise, skipping an already completed entry", () => {
    const addPauseTimeSpy = spyOnAddPauseTime();
    const { result } = renderHook(() => useExerciseProgression());

    mockNow += 5_000;
    act(() => {
      result.current.advanceToNextExercise();
    });

    mockNow += 3_000;
    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(addPauseTimeSpy).toHaveBeenCalledWith(3_000);
  });
});

describe("useExerciseProgression: advanceToNextExercise finish decision when the last array slot is already completed out of order", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow = 10_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => mockNow);

    useTrainingStore.setState(BASELINE_TRAINING_STATE);
    useTrainingStore.setState({
      exerciseList: [
        createExercise({ exerciseId: "1", skill: "SWR1" }),
        createExercise({ exerciseId: "2", skill: "SWR1", completed: true }),
      ],
      activeTraining: { id: "training-1", type: "PLAN" },
    });

    seedUserStores();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("calls finishTraining instead of arming a timer when the only remaining incomplete exercise sits before the last array slot", () => {
    const { result } = renderHook(() => useExerciseProgression());

    act(() => {
      result.current.advanceToNextExercise();
    });

    expect(mockFinishTraining).toHaveBeenCalledWith(false, undefined);
  });
});

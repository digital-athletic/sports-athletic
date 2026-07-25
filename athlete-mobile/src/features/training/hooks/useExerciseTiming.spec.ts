import { useTrainingStore } from "@/features/training/trainingStore";
import { BASELINE_TRAINING_STATE } from "@/features/training/utils/testFixtures";
import { act, renderHook } from "@testing-library/react-native";
import { useExerciseTiming } from "./useExerciseTiming";

let mockNow = 0;

beforeEach(() => {
  mockNow = 1_000_000;
  jest.spyOn(Date, "now").mockImplementation(() => mockNow);
  useTrainingStore.setState(BASELINE_TRAINING_STATE);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("useExerciseTiming: handlePauseToggled", () => {
  it("resume adds the elapsed pause duration to exercise elapsed time", () => {
    const { result } = renderHook(() => useExerciseTiming());

    act(() => {
      result.current.handlePauseToggled(false); // pause
    });

    mockNow += 5_000; // 5s pass while paused

    act(() => {
      result.current.handlePauseToggled(true); // resume
    });

    const elapsedBeforePause = result.current.getExerciseElapsed();

    mockNow += 2_000; // 2s pass after resume

    expect(result.current.getExerciseElapsed()).toBe(
      elapsedBeforePause + 2_000,
    );
  });
});

describe("useExerciseTiming: markPauseStart and getPauseElapsed", () => {
  it("returns the elapsed time since markPauseStart was called", () => {
    const { result } = renderHook(() => useExerciseTiming());

    act(() => {
      result.current.markPauseStart();
    });

    mockNow += 3_000;

    expect(result.current.getPauseElapsed()).toBe(3_000);
  });
});

describe("useExerciseTiming: resetExerciseStart", () => {
  it("zeroes exercise elapsed time at the controlled Date.now", () => {
    const { result } = renderHook(() => useExerciseTiming());

    mockNow += 10_000;

    act(() => {
      result.current.resetExerciseStart();
    });

    expect(result.current.getExerciseElapsed()).toBe(0);
  });
});

describe("useExerciseTiming: training start timer reset", () => {
  it("resets exercise elapsed time when activeTraining changes", () => {
    const { result } = renderHook(() => useExerciseTiming());

    mockNow += 4_000;
    expect(result.current.getExerciseElapsed()).toBe(4_000);

    act(() => {
      useTrainingStore.setState({
        activeTraining: { id: "training-1", type: "PLAN" },
      });
    });

    expect(result.current.getExerciseElapsed()).toBe(0);
  });
});

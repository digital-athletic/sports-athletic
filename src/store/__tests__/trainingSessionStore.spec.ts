import { act, renderHook } from "@testing-library/react-native";
import {
  trainingSessionSelectors,
  useTrainingSessionStore,
} from "../trainingSessionStore";

describe("useTrainingSessionStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useTrainingSessionStore.getState().resetSession();
    });
  });

  it("should have default initial state", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    expect(result.current.isActive).toBe(false);
    expect(result.current.startTime).toBe(null);
    expect(result.current.currentExerciseId).toBe(null);
    expect(result.current.completedExercises).toEqual([]);
  });

  it("should start a session", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    act(() => {
      result.current.startSession();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.startTime).not.toBe(null);
    expect(result.current.completedExercises).toEqual([]);
  });

  it("should end a session", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    act(() => {
      result.current.startSession();
      result.current.endSession();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.startTime).toBe(null);
    expect(result.current.currentExerciseId).toBe(null);
  });

  it("should set current exercise", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    act(() => {
      result.current.setCurrentExercise("exercise-1");
    });

    expect(result.current.currentExerciseId).toBe("exercise-1");
  });

  it("should complete exercise and add to completed list", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    act(() => {
      result.current.setCurrentExercise("exercise-1");
      result.current.completeExercise("exercise-1");
    });

    expect(result.current.completedExercises).toContain("exercise-1");
    expect(result.current.currentExerciseId).toBe(null);
  });

  it("should handle multiple completed exercises", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    act(() => {
      result.current.completeExercise("exercise-1");
      result.current.completeExercise("exercise-2");
      result.current.completeExercise("exercise-3");
    });

    expect(result.current.completedExercises).toEqual([
      "exercise-1",
      "exercise-2",
      "exercise-3",
    ]);
  });

  it("should reset session", () => {
    const { result } = renderHook(() => useTrainingSessionStore());

    act(() => {
      result.current.startSession();
      result.current.setCurrentExercise("exercise-1");
      result.current.completeExercise("exercise-1");
    });

    act(() => {
      result.current.resetSession();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.startTime).toBe(null);
    expect(result.current.currentExerciseId).toBe(null);
    expect(result.current.completedExercises).toEqual([]);
  });

  describe("selectors", () => {
    it("should calculate exercise count", () => {
      const { result } = renderHook(() => useTrainingSessionStore());

      act(() => {
        result.current.completeExercise("exercise-1");
        result.current.completeExercise("exercise-2");
      });

      const count = trainingSessionSelectors.exerciseCount(result.current);
      expect(count).toBe(2);
    });

    it("should detect active exercise", () => {
      const { result } = renderHook(() => useTrainingSessionStore());

      let hasActive = trainingSessionSelectors.hasActiveExercise(
        result.current
      );
      expect(hasActive).toBe(false);

      act(() => {
        result.current.setCurrentExercise("exercise-1");
      });

      hasActive = trainingSessionSelectors.hasActiveExercise(result.current);
      expect(hasActive).toBe(true);
    });

    it("should calculate session duration", () => {
      const { result } = renderHook(() => useTrainingSessionStore());

      let duration = trainingSessionSelectors.sessionDuration(result.current);
      expect(duration).toBe(null);

      act(() => {
        result.current.startSession();
      });

      duration = trainingSessionSelectors.sessionDuration(result.current);
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});

import {
  accumulateExerciseTotals,
  createEmptyExerciseTotals,
  type ExerciseTotalsType,
} from "@/features/training/models/ExerciseTotals";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { syncManager } from "@/services/SyncManager";
import { act, renderHook } from "@testing-library/react-native";
import { useExerciseProgressStore } from "./exerciseProgressStore";

jest.mock("@/services/SyncManager", () => ({
  syncManager: {
    notifyExerciseUpdated: jest.fn(),
    notifyTestResultAdded: jest.fn(),
  },
}));

describe("ExerciseTotals Types", () => {
  describe("createEmptyExerciseTotals", () => {
    it("returns an object with all values set to 0", () => {
      const result = createEmptyExerciseTotals();

      expect(result).toEqual({
        weight: 0,
        duration: 0,
        repetition: 0,
        height: 0,
      });
    });

    it("returns a new object each time", () => {
      const first = createEmptyExerciseTotals();
      const second = createEmptyExerciseTotals();

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe("accumulateExerciseTotals", () => {
    it("accumulates values into existing totals", () => {
      const existing: ExerciseTotalsType = {
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      };

      const result = accumulateExerciseTotals(existing, 50, 30, 5, 10);

      expect(result).toEqual({
        weight: 150,
        duration: 90,
        repetition: 15,
        height: 60,
      });
    });

    it("creates new totals when existing is undefined", () => {
      const result = accumulateExerciseTotals(undefined, 100, 60, 10, 50);

      expect(result).toEqual({
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      });
    });

    it("handles undefined values with ?? 0", () => {
      const existing: ExerciseTotalsType = {
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      };

      const result = accumulateExerciseTotals(
        existing,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(result).toEqual(existing);
    });

    it("handles partial undefined values", () => {
      const existing: ExerciseTotalsType = {
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      };

      const result = accumulateExerciseTotals(existing, 50, undefined, 5);

      expect(result).toEqual({
        weight: 150,
        duration: 60,
        repetition: 15,
        height: 50,
      });
    });

    it("handles zero values correctly", () => {
      const existing: ExerciseTotalsType = {
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      };

      const result = accumulateExerciseTotals(existing, 0, 0, 0, 0);

      expect(result).toEqual(existing);
    });

    it("handles negative values (edge case)", () => {
      const existing: ExerciseTotalsType = {
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      };

      const result = accumulateExerciseTotals(existing, -10, -5, -2, -1);

      expect(result).toEqual({
        weight: 90,
        duration: 55,
        repetition: 8,
        height: 49,
      });
    });

    it("returns a new object (immutability)", () => {
      const existing: ExerciseTotalsType = {
        weight: 100,
        duration: 60,
        repetition: 10,
        height: 50,
      };

      const result = accumulateExerciseTotals(existing, 50, 30, 5, 10);

      expect(result).not.toBe(existing);
      expect(existing.weight).toBe(100); // Original unchanged
    });
  });
});

describe("updateUserExerciseTotals", () => {
  beforeEach(() => {
    act(() => {
      useExerciseProgressStore.getState().resetProgress();
    });
  });

  it("creates new totals for a new exercise", () => {
    const { updateUserExerciseTotals } = useExerciseProgressStore.getState();

    act(() => {
      updateUserExerciseTotals("exercise-1", 100, 60, 10, 50);
    });

    const { exerciseTotals } = useExerciseProgressStore.getState();

    expect(exerciseTotals["exercise-1"]).toEqual({
      weight: 100,
      duration: 60,
      repetition: 10,
      height: 50,
    });
  });

  it("accumulates values for existing exercise", () => {
    const { updateUserExerciseTotals } = useExerciseProgressStore.getState();

    act(() => {
      updateUserExerciseTotals("exercise-1", 100, 60, 10, 50);
    });

    act(() => {
      updateUserExerciseTotals("exercise-1", 50, 30, 5, 10);
    });

    const { exerciseTotals } = useExerciseProgressStore.getState();

    expect(exerciseTotals["exercise-1"]).toEqual({
      weight: 150,
      duration: 90,
      repetition: 15,
      height: 60,
    });
  });

  it("handles multiple exercises independently", () => {
    const { updateUserExerciseTotals } = useExerciseProgressStore.getState();

    act(() => {
      updateUserExerciseTotals("exercise-1", 100, 60, 10, 50);
      updateUserExerciseTotals("exercise-2", 200, 120, 20, 100);
    });

    const { exerciseTotals } = useExerciseProgressStore.getState();

    expect(exerciseTotals["exercise-1"]).toEqual({
      weight: 100,
      duration: 60,
      repetition: 10,
      height: 50,
    });

    expect(exerciseTotals["exercise-2"]).toEqual({
      weight: 200,
      duration: 120,
      repetition: 20,
      height: 100,
    });
  });

  it("handles partial parameters with defaults", () => {
    const { updateUserExerciseTotals } = useExerciseProgressStore.getState();

    act(() => {
      updateUserExerciseTotals("exercise-1", 100);
    });

    const { exerciseTotals } = useExerciseProgressStore.getState();

    expect(exerciseTotals["exercise-1"]).toEqual({
      weight: 100,
      duration: 0,
      repetition: 0,
      height: 0,
    });
  });

  it("getExerciseTotals returns totals for specific exercise", () => {
    const { updateUserExerciseTotals, getExerciseTotals } =
      useExerciseProgressStore.getState();

    act(() => {
      updateUserExerciseTotals("exercise-1", 100, 60, 10, 50);
    });

    expect(getExerciseTotals("exercise-1")).toEqual({
      weight: 100,
      duration: 60,
      repetition: 10,
      height: 50,
    });
    expect(getExerciseTotals("non-existent")).toBeUndefined();
  });
});

describe("exerciseProgressStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useExerciseProgressStore());
    act(() => {
      result.current.resetProgress();
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts with zero xp and level 1", () => {
      const { result } = renderHook(() => useExerciseProgressStore());
      expect(result.current.xp).toBe(0);
      expect(result.current.level).toBe(1);
    });

    it("has empty exercise and branch data", () => {
      const { result } = renderHook(() => useExerciseProgressStore());
      expect(result.current.exerciseData).toEqual({});
      expect(result.current.branchData).toEqual({});
    });
  });

  describe("addXP", () => {
    it("increments xp amount", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.addXP(500);
      });

      expect(result.current.xp).toBe(500);
    });

    it("calculates level from xp (1000 xp per level)", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.addXP(2500);
      });

      expect(result.current.level).toBe(3); // floor(2500/1000) + 1 = 3
    });
  });

  describe("updateExercise", () => {
    it("creates new exercise entry", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 10,
        });
      });

      expect(result.current.exerciseData["ex1"]?.repetition).toBe(10);
    });

    it("updates existing exercise", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 10,
        });
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 15,
        });
      });

      expect(result.current.exerciseData["ex1"]?.repetition).toBe(15);
    });

    it("tracks feedback streak for same difficulty", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          feedback: { difficulty: "TOO_EASY" },
        });
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          feedback: { difficulty: "TOO_EASY" },
        });
      });

      expect(result.current.exerciseData["ex1"]?.feedback?.streakCounter).toBe(
        2,
      );
    });

    it("notifies sync of exercise update", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 10,
        });
      });

      expect(syncManager.notifyExerciseUpdated).toHaveBeenCalledWith(
        "ex1",
        expect.objectContaining({
          exerciseId: "ex1",
          skill: "WU",
          repetition: 10,
        }),
      );
    });

    it("notifies sync for each update", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 10,
        });
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 15,
        });
      });

      expect(syncManager.notifyExerciseUpdated).toHaveBeenCalledTimes(2);
    });

    it("stores duration and branchId on new exercise", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "SWR1",
          duration: 30,
          branchId: "branch-1",
        });
      });

      expect(result.current.exerciseData["ex1"]).toEqual(
        expect.objectContaining({
          duration: 30,
          branchId: "branch-1",
        }),
      );
    });

    it("updates duration and branchId on existing exercise", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "SWR1",
          duration: 30,
          branchId: "branch-1",
        });
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "SWR1",
          duration: 45,
          branchId: "branch-2",
        });
      });

      expect(result.current.exerciseData["ex1"]).toEqual(
        expect.objectContaining({
          duration: 45,
          branchId: "branch-2",
        }),
      );
    });

    it("stores weight of zero", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          weight: 0,
        });
      });

      expect(result.current.exerciseData["ex1"]?.weight).toBe(0);
    });

    it("stores skipped flag", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          skipped: true,
        });
      });

      expect(result.current.exerciseData["ex1"]?.skipped).toBe(true);
    });

    it("includes workoutId in sync notification when provided", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise(
          "ex1",
          { exerciseId: "ex1", skill: "WU", repetition: 10 },
          "workout-42",
        );
      });

      expect(syncManager.notifyExerciseUpdated).toHaveBeenCalledWith(
        "ex1",
        expect.objectContaining({
          exerciseId: "ex1",
          workoutId: "workout-42",
        }),
      );
    });

    it("omits workoutId from sync notification when not provided", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WU",
          repetition: 5,
        });
      });

      const call = (syncManager.notifyExerciseUpdated as jest.Mock).mock
        .calls[0][1];
      expect(call).not.toHaveProperty("workoutId");
    });
  });

  describe("resetExercise", () => {
    it("keeps only exerciseId, skill and branchId and notifies sync", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "MAX_KRAFT",
          branchId: "branch-1",
          weight: 80,
          repetition: 5,
          nextWeightPercentage: 70,
          maxFRepetitions: [{ level: "HARD", repetitions: 3 }],
          maxFLevelAdjustment: "SUCCEEDED",
          feedback: { difficulty: "SUCCEEDED" },
        });
      });
      jest.clearAllMocks();

      act(() => {
        result.current.resetExercise(
          "ex1",
          { skill: "MAX_KRAFT", branchId: "branch-1" },
          "workout-42",
        );
      });

      expect(result.current.exerciseData["ex1"]).toEqual({
        exerciseId: "ex1",
        skill: "MAX_KRAFT",
        branchId: "branch-1",
      });
      expect(syncManager.notifyExerciseUpdated).toHaveBeenCalledWith("ex1", {
        exerciseId: "ex1",
        skill: "MAX_KRAFT",
        branchId: "branch-1",
        workoutId: "workout-42",
      });
    });
  });

  describe("setBranchLevel", () => {
    it("creates branch with level", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.setBranchLevel("branch1", 3, "301");
      });

      expect(result.current.branchData["branch1"]?.level).toBe(3);
    });

    it("updates existing branch level", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.setBranchLevel("branch1", 2, "201");
        result.current.setBranchLevel("branch1", 5, "501");
      });

      expect(result.current.branchData["branch1"]?.level).toBe(5);
    });

    it("stores the exercise of the new level", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.setBranchLevel("branch1", 2, "201");
        result.current.setBranchLevel("branch1", 5, "501");
      });

      expect(result.current.branchData["branch1"]?.exerciseId).toBe("501");
    });
  });

  describe("setBranchData", () => {
    it("replaces the stored branch data", () => {
      const { result } = renderHook(() => useExerciseProgressStore());
      const branchData = {
        branch2: { branchId: "branch2", level: 4, exerciseId: "401" },
      };

      act(() => {
        result.current.setBranchLevel("branch1", 2, "201");
        result.current.setBranchData(branchData);
      });

      expect(result.current.branchData).toEqual(branchData);
    });
  });

  describe("getBranchLevel", () => {
    it("returns 0 for unknown branch", () => {
      const { result } = renderHook(() => useExerciseProgressStore());
      expect(result.current.getBranchLevel("unknown")).toBe(0);
    });
  });

  describe("addTestResult", () => {
    it("appends to test history", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.addTestResult(DEFAULT_MAX_VALUES);
      });

      expect(result.current.testHistory).toHaveLength(1);
    });

    it("notifies sync of test result", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.addTestResult(DEFAULT_MAX_VALUES);
      });

      expect(syncManager.notifyTestResultAdded).toHaveBeenCalledWith(
        DEFAULT_MAX_VALUES,
      );
    });
  });

  describe("getLatestTestResult", () => {
    it("returns undefined when no history", () => {
      const { result } = renderHook(() => useExerciseProgressStore());
      expect(result.current.getLatestTestResult()).toBeUndefined();
    });

    it("returns most recent result", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.addTestResult({ ...DEFAULT_MAX_VALUES, testAt: 1000 });
        result.current.addTestResult({ ...DEFAULT_MAX_VALUES, testAt: 2000 });
      });

      expect(result.current.getLatestTestResult()?.testAt).toBe(2000);
    });
  });
});

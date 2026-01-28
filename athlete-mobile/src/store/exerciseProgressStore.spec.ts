import { act, renderHook } from "@testing-library/react-native";
import { useExerciseProgressStore } from "./exerciseProgressStore";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";

describe("exerciseProgressStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useExerciseProgressStore());
    act(() => {
      result.current.clearProgress();
    });
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
          skill: "WARMUP",
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
          skill: "WARMUP",
          repetition: 10,
        });
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WARMUP",
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
          skill: "WARMUP",
          feedback: { difficulty: "TOO_EASY" },
        });
        result.current.updateExercise("ex1", {
          exerciseId: "ex1",
          skill: "WARMUP",
          feedback: { difficulty: "TOO_EASY" },
        });
      });

      expect(result.current.exerciseData["ex1"]?.feedback?.streakCounter).toBe(
        2,
      );
    });
  });

  describe("setBranchLevel", () => {
    it("creates branch with level", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.setBranchLevel("branch1", 3);
      });

      expect(result.current.branchData["branch1"]?.level).toBe(3);
    });

    it("updates existing branch level", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.setBranchLevel("branch1", 2);
        result.current.setBranchLevel("branch1", 5);
      });

      expect(result.current.branchData["branch1"]?.level).toBe(5);
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
  });

  describe("getLatestTestResult", () => {
    it("returns undefined when no history", () => {
      const { result } = renderHook(() => useExerciseProgressStore());
      expect(result.current.getLatestTestResult()).toBeUndefined();
    });

    it("returns most recent result", () => {
      const { result } = renderHook(() => useExerciseProgressStore());

      act(() => {
        result.current.addTestResult({ ...DEFAULT_MAX_VALUES, testDate: "01" });
        result.current.addTestResult({ ...DEFAULT_MAX_VALUES, testDate: "02" });
      });

      expect(result.current.getLatestTestResult()?.testDate).toBe("02");
    });
  });
});

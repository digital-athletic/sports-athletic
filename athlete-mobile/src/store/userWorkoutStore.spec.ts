import { act, renderHook } from "@testing-library/react-native";
import { useUserWorkoutStore } from "./userWorkoutStore";

describe("userWorkoutStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useUserWorkoutStore());
    act(() => {
      result.current.clearUserWorkoutData();
    });
  });

  describe("initial state", () => {
    it("has default workout data", () => {
      const { result } = renderHook(() => useUserWorkoutStore());
      expect(result.current.workoutData.anamnesisCompleted).toBe(false);
      expect(result.current.workoutData.sport).toBe("OTHER_SPORT");
    });

    it("has no training plan", () => {
      const { result } = renderHook(() => useUserWorkoutStore());
      expect(result.current.trainingPlan).toBeNull();
    });
  });

  describe("setWorkoutData", () => {
    it("merges partial data", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setWorkoutData({ weight: 80, height: 180 });
      });

      expect(result.current.workoutData.weight).toBe(80);
      expect(result.current.workoutData.height).toBe(180);
      expect(result.current.workoutData.sport).toBe("OTHER_SPORT"); // unchanged
    });
  });

  describe("setSport", () => {
    it("updates sport field", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setSport("HANDBALL_SPORT");
      });

      expect(result.current.workoutData.sport).toBe("HANDBALL_SPORT");
    });
  });

  describe("setTags", () => {
    it("replaces tags array", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setTags(["LEVEL_ADVANCED", "POSITION_GOAL"]);
      });

      expect(result.current.workoutData.tags).toEqual([
        "LEVEL_ADVANCED",
        "POSITION_GOAL",
      ]);
    });
  });

  describe("setTrainingPlan", () => {
    it("sets training plan", () => {
      const { result } = renderHook(() => useUserWorkoutStore());
      const plan = { start: new Date().toISOString(), sections: [] };

      act(() => {
        result.current.setTrainingPlan(plan);
      });

      expect(result.current.trainingPlan).not.toBeNull();
    });

    it("clears training plan with null", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setTrainingPlan({
          start: new Date().toISOString(),
          sections: [],
        });
        result.current.setTrainingPlan(null);
      });

      expect(result.current.trainingPlan).toBeNull();
    });
  });

  describe("saveMaxValues", () => {
    it("updates maxValues in workoutData", () => {
      const { result } = renderHook(() => useUserWorkoutStore());
      const newMaxValues = {
        testDate: "15-01-2025",
        verticalPush: { barbell: 100 },
        verticalPull: {},
        horizontalPush: {},
        horizontalPull: {},
        hip: {},
        knee: {},
        lower_body: {},
      };

      act(() => {
        result.current.saveMaxValues(newMaxValues);
      });

      expect(result.current.workoutData.maxValues.verticalPush.barbell).toBe(
        100,
      );
    });
  });

  describe("setSeasonPhase", () => {
    it("updates season phase", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setSeasonPhase({
          type: "COMPETITION",
          endDate: "31-12-2025",
        });
      });

      expect(result.current.workoutData.seasonPhase.type).toBe("COMPETITION");
    });
  });

  describe("clearUserWorkoutData", () => {
    it("resets to initial state", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setWorkoutData({ weight: 100 });
        result.current.setTrainingPlan({
          start: new Date().toISOString(),
          sections: [],
        });
        result.current.clearUserWorkoutData();
      });

      expect(result.current.workoutData.weight).toBe(65);
      expect(result.current.trainingPlan).toBeNull();
    });
  });
});

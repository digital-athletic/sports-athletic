import { act, renderHook } from "@testing-library/react-native";
import { formatDateToISO } from "@/utils/date";
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
      expect(result.current.workoutData.sport).toBe("OTHER_SPORT");
      expect(result.current.workoutData.tags).toEqual({
        POSITION: ["FIELD"],
        LEVEL: ["BEGINNER"],
      });
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
        result.current.setWorkoutData({ sport: "FOOTBALL_SPORT" });
      });

      expect(result.current.workoutData.sport).toBe("FOOTBALL_SPORT");
      expect(result.current.workoutData.tags).toEqual({
        POSITION: ["FIELD"],
        LEVEL: ["BEGINNER"],
      }); // unchanged
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
    it("replaces tags with structured format", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setTags({ LEVEL: ["ADVANCED"], POSITION: ["GOAL"] });
      });

      expect(result.current.workoutData.tags).toEqual({
        LEVEL: ["ADVANCED"],
        POSITION: ["GOAL"],
      });
    });
  });

  describe("setTrainingPlan", () => {
    it("sets training plan", () => {
      const { result } = renderHook(() => useUserWorkoutStore());
      const plan = { start: formatDateToISO(new Date()), sections: [] };

      act(() => {
        result.current.setTrainingPlan(plan);
      });

      expect(result.current.trainingPlan).not.toBeNull();
    });

    it("clears training plan with null", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setTrainingPlan({
          start: formatDateToISO(new Date()),
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
        testDate: new Date("2025-01-15").getTime(),
        verticalPush: { barbell: 100 },
        verticalPull: {},
        horizontalPush: {},
        horizontalPull: {},
        hip: {},
        knee: {},
        lowerBody: {},
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
          endDate: "2025-12-31",
        });
      });

      expect(result.current.workoutData.seasonPhase.type).toBe("COMPETITION");
    });
  });

  describe("clearUserWorkoutData", () => {
    it("resets to initial state", () => {
      const { result } = renderHook(() => useUserWorkoutStore());

      act(() => {
        result.current.setSport("FOOTBALL_SPORT");
        result.current.setTrainingPlan({
          start: formatDateToISO(new Date()),
          sections: [],
        });
        result.current.clearUserWorkoutData();
      });

      expect(result.current.workoutData.sport).toBe("OTHER_SPORT");
      expect(result.current.trainingPlan).toBeNull();
    });
  });
});

import { act, renderHook } from "@testing-library/react-native";
import { formatDateToISO } from "@/utils/date";
import { useUserWorkoutStore } from "./userWorkoutStore";

describe("userWorkoutStore", () => {
  beforeEach(async () => {
    const { result } = await renderHook(() => useUserWorkoutStore());
    await act(() => {
      result.current.resetUserWorkoutData();
    });
  });

  describe("initial state", () => {
    it("has default workout data", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());
      expect(result.current.workoutData.sport).toBe("OTHER_SPORT");
      expect(result.current.workoutData.tags).toEqual({
        POSITION: ["FIELD"],
        LEVEL: ["BEGINNER"],
      });
    });

    it("has no training plan", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());
      expect(result.current.trainingPlan).toBeNull();
    });
  });

  describe("setWorkoutData", () => {
    it("merges partial data", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());

      await act(() => {
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
    it("updates sport field", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());

      await act(() => {
        result.current.setSport("HANDBALL_SPORT");
      });

      expect(result.current.workoutData.sport).toBe("HANDBALL_SPORT");
    });
  });

  describe("setTags", () => {
    it("replaces tags with structured format", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());

      await act(() => {
        result.current.setTags({ LEVEL: ["ADVANCED"], POSITION: ["GOAL"] });
      });

      expect(result.current.workoutData.tags).toEqual({
        LEVEL: ["ADVANCED"],
        POSITION: ["GOAL"],
      });
    });
  });

  describe("setTrainingPlan", () => {
    it("sets training plan", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());
      const plan = { start: formatDateToISO(new Date()), sections: [] };

      await act(() => {
        result.current.setTrainingPlan(plan);
      });

      expect(result.current.trainingPlan).not.toBeNull();
    });

    it("clears training plan with null", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());

      await act(() => {
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
    it("updates maxValues in workoutData", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());
      const newMaxValues = {
        testAt: new Date("2025-01-15").getTime(),
        verticalPush: { barbell: 100 },
        verticalPull: {},
        horizontalPush: {},
        horizontalPull: {},
        hipHinge: {},
        kneeDominant: {},
        lowerBody: {},
      };

      await act(() => {
        result.current.saveMaxValues(newMaxValues);
      });

      expect(result.current.workoutData.maxValues.verticalPush.barbell).toBe(
        100,
      );
    });
  });

  describe("setSeasonPhase", () => {
    it("updates season phase", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());

      await act(() => {
        result.current.setSeasonPhase({
          type: "COMPETITION",
          endDate: "2025-12-31",
        });
      });

      expect(result.current.workoutData.seasonPhase.type).toBe("COMPETITION");
    });
  });

  describe("resetUserWorkoutData", () => {
    it("resets to initial state", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());

      await act(() => {
        result.current.setSport("FOOTBALL_SPORT");
        result.current.setTrainingPlan({
          start: formatDateToISO(new Date()),
          sections: [],
        });
        result.current.resetUserWorkoutData();
      });

      expect(result.current.workoutData.sport).toBe("OTHER_SPORT");
      expect(result.current.trainingPlan).toBeNull();
    });
  });
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { createAiwlPlan } from "@/features/training/utils/testFixtures";
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

  describe("replaceBranchInTrainingPlan", () => {
    it("leaves a training stored as an AIWL workout unchanged", async () => {
      const { result } = await renderHook(() => useUserWorkoutStore());
      const plan = createAiwlPlan();

      await act(() => {
        result.current.setTrainingPlan(plan);
        result.current.replaceBranchInTrainingPlan(0, 1, "WU", "410", []);
      });

      expect(result.current.trainingPlan).toEqual(plan);
    });
  });

  describe("rehydration of a store at version 17", () => {
    const workoutData = {
      sport: "FOOTBALL_SPORT",
      tags: { LEVEL: ["ADVANCED"], POSITION: ["GOAL"] },
      seasonPhase: { type: "COMPETITION", endDate: "2026-12-31" },
      maxValues: {
        ...DEFAULT_MAX_VALUES,
        testAt: new Date("2026-09-01").getTime(),
        verticalPush: { barbell: 80 },
      },
    };

    afterEach(async () => {
      await AsyncStorage.clear();
    });

    it("keeps the AIWL plan, max values and workout data", async () => {
      const plan = createAiwlPlan();
      await AsyncStorage.setItem(
        "user-workout-storage",
        JSON.stringify({
          state: { workoutData, trainingPlan: plan },
          version: 17,
        }),
      );

      await useUserWorkoutStore.persist.rehydrate();

      const state = useUserWorkoutStore.getState();
      expect(state.trainingPlan).toEqual(plan);
      expect(state.workoutData.maxValues).toEqual(workoutData.maxValues);
      expect(state.workoutData).toEqual(workoutData);
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

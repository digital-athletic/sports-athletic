import { syncManager } from "@/services/SyncManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { useExerciseProgressStore } from "./exerciseProgressStore";
import { STORE_VERSIONS } from "./storeVersions";

jest.mock("@/services/SyncManager", () => ({
  syncManager: {
    notifyExerciseUpdated: jest.fn(),
    notifyTestResultAdded: jest.fn(),
  },
}));

describe("exerciseProgressStore: progress per skill", () => {
  beforeEach(async () => {
    const { result } = await renderHook(() => useExerciseProgressStore());
    await act(() => {
      result.current.resetProgress();
    });
    jest.clearAllMocks();
  });

  describe("updateExercise", () => {
    it("creates one record per skill for the same exercise", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SA",
          weight: 30,
        });
      });

      expect(result.current.exerciseProgress["SWR1"]?.["1"]?.weight).toBe(50);
      expect(result.current.exerciseProgress["SA"]?.["1"]?.weight).toBe(30);
    });

    it("keeps merging every write into the one record per exercise", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SA",
          repetition: 8,
        });
      });

      expect(result.current.exerciseData["1"]).toEqual({
        exerciseId: "1",
        skill: "SA",
        weight: 50,
        repetition: 8,
        updatedAt: expect.any(Number),
      });
    });

    it("counts the feedback streak per skill", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          feedback: { difficulty: "TOO_EASY" },
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          feedback: { difficulty: "TOO_EASY" },
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SA",
          feedback: { difficulty: "TOO_EASY" },
        });
      });

      expect(
        result.current.exerciseProgress["SWR1"]?.["1"]?.feedback?.streakCounter,
      ).toBe(2);
      expect(
        result.current.exerciseProgress["SA"]?.["1"]?.feedback?.streakCounter,
      ).toBe(1);
    });

    it("sends the merged record per exercise to sync once per write", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SA",
          repetition: 8,
        });
      });

      expect(syncManager.notifyExerciseUpdated).toHaveBeenCalledTimes(2);
      expect(syncManager.notifyExerciseUpdated).toHaveBeenLastCalledWith("1", {
        exerciseId: "1",
        skill: "SA",
        weight: 50,
        repetition: 8,
      });
    });
  });

  describe("resetExercise", () => {
    it("replaces the record of the given skill and the record per exercise", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());
      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
          repetition: 12,
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SA",
          weight: 30,
          repetition: 8,
        });
      });
      const saBefore = structuredClone(result.current.exerciseProgress["SA"]);

      await act(() => {
        result.current.resetExercise("1", { skill: "SWR1" });
      });

      const reset = {
        exerciseId: "1",
        skill: "SWR1",
        updatedAt: expect.any(Number),
      };
      expect(result.current.exerciseProgress["SWR1"]?.["1"]).toEqual(reset);
      expect(result.current.exerciseData["1"]).toEqual(reset);
      expect(result.current.exerciseProgress["SA"]).toEqual(saBefore);
    });
  });

  describe("rehydration", () => {
    it("loads a persisted state without records per skill and reads its older record", async () => {
      const older = { exerciseId: "1", skill: "SWR1", weight: 26 };
      await AsyncStorage.setItem(
        "exercise-progress-storage",
        JSON.stringify({
          state: { exerciseData: { "1": older } },
          version: STORE_VERSIONS.EXERCISE_PROGRESS,
        }),
      );

      await useExerciseProgressStore.persist.rehydrate();

      const state = useExerciseProgressStore.getState();
      expect(state.exerciseProgress).toEqual({});
      expect(state.getExerciseProgress("SWR1", "1")).toEqual(older);
    });
  });

  describe("resetProgress", () => {
    it("clears the records per skill", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());
      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
        });
      });

      await act(() => {
        result.current.resetProgress();
      });

      expect(result.current.exerciseProgress).toEqual({});
    });
  });

  describe("updatedAt", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(1761550000999);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("stamps the record per skill in Unix seconds", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
        });
      });

      expect(result.current.exerciseProgress["SWR1"]?.["1"]?.updatedAt).toBe(
        1761550000,
      );
    });
  });
});

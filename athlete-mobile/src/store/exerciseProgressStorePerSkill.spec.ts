import { syncManager } from "@/services/SyncManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import {
  generateExerciseDataMap,
  generateStoredExerciseData,
} from "@test/factories/storedExerciseData";
import { useExerciseProgressStore } from "./exerciseProgressStore";

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
    it("keeps the record of each skill apart", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("342", {
          exerciseId: "342",
          skill: "SA",
          weight: 50,
        });
        result.current.updateExercise("342", {
          exerciseId: "342",
          skill: "HYP",
          repetition: 8,
        });
      });

      expect(result.current.exerciseProgress).toEqual({
        SA: {
          "342": {
            exerciseId: "342",
            skill: "SA",
            weight: 50,
            updatedAt: expect.any(Number),
          },
        },
        HYP: {
          "342": {
            exerciseId: "342",
            skill: "HYP",
            repetition: 8,
            updatedAt: expect.any(Number),
          },
        },
      });
    });

    it("names the skill that wrote the shared record last", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("342", {
          exerciseId: "342",
          skill: "SA",
          weight: 50,
          repetition: 15,
        });
        result.current.updateExercise("342", {
          exerciseId: "342",
          skill: "HYP",
          repetition: 8,
        });
      });

      expect(result.current.exerciseData["342"]).toEqual({
        exerciseId: "342",
        skill: "HYP",
        weight: 50,
        repetition: 8,
        updatedAt: expect.any(Number),
      });
    });

    it("sends the record of the writing skill to sync", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());

      await act(() => {
        result.current.updateExercise("342", {
          exerciseId: "342",
          skill: "SA",
          weight: 50,
          repetition: 15,
        });
        result.current.updateExercise(
          "342",
          { exerciseId: "342", skill: "HYP", repetition: 8 },
          "workout-42",
        );
      });

      expect(syncManager.notifyExerciseUpdated).toHaveBeenLastCalledWith(
        "342",
        {
          exerciseId: "342",
          skill: "HYP",
          repetition: 8,
          workoutId: "workout-42",
        },
      );
    });
  });

  describe("resetExercise", () => {
    it("resets the record of the given skill and the shared record, and leaves other skills", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());
      await act(() => {
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SA",
          weight: 30,
          repetition: 8,
        });
        result.current.updateExercise("1", {
          exerciseId: "1",
          skill: "SWR1",
          weight: 50,
          repetition: 12,
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
    it("moves the older record of a version 19 state to the skill it names", async () => {
      const older = generateStoredExerciseData({ skill: "SWR1", weight: 26 });
      await AsyncStorage.setItem(
        "exercise-progress-storage",
        JSON.stringify({
          state: { exerciseData: generateExerciseDataMap(older) },
          version: 19,
        }),
      );

      await act(async () => {
        await useExerciseProgressStore.persist.rehydrate();
      });

      const state = useExerciseProgressStore.getState();
      expect(state.exerciseProgress).toEqual({ SWR1: { "1": older } });
      expect(state.exerciseData["1"]).toEqual(older);
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
});

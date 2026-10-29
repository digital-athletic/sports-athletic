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
    it("leaves the shared record to the skill it names", async () => {
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
          weight: 62.5,
          repetition: 8,
        });
      });

      expect(result.current.exerciseData["342"]).toEqual({
        exerciseId: "342",
        skill: "SA",
        weight: 50,
        repetition: 15,
        updatedAt: expect.any(Number),
      });
      expect(result.current.exerciseProgress["HYP"]?.["342"]).toEqual({
        exerciseId: "342",
        skill: "HYP",
        weight: 62.5,
        repetition: 8,
        updatedAt: expect.any(Number),
      });
    });

    it("starts the first record of a skill from the older record that skill wrote", async () => {
      const { result } = await renderHook(() => useExerciseProgressStore());
      await act(() => {
        useExerciseProgressStore.setState({
          exerciseProgress: {},
          exerciseData: {
            "26": {
              exerciseId: "26",
              skill: "MAX_STRENGTH",
              nextWeightPercentage: 75,
              feedback: { difficulty: "TOO_EASY", streakCounter: 3 },
            },
          },
        });
      });

      await act(() => {
        result.current.updateExercise("26", {
          exerciseId: "26",
          skill: "MAX_STRENGTH",
          feedback: { difficulty: "TOO_EASY" },
        });
      });

      expect(result.current.exerciseProgress["MAX_STRENGTH"]?.["26"]).toEqual({
        exerciseId: "26",
        skill: "MAX_STRENGTH",
        nextWeightPercentage: 75,
        feedback: { difficulty: "TOO_EASY", streakCounter: 4 },
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
    it("resets the record of the given skill and leaves the shared record of another skill", async () => {
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
      const sharedBefore = structuredClone(result.current.exerciseData["1"]);
      const saBefore = structuredClone(result.current.exerciseProgress["SA"]);

      await act(() => {
        result.current.resetExercise("1", { skill: "SWR1" });
      });

      expect(result.current.exerciseProgress["SWR1"]?.["1"]).toEqual({
        exerciseId: "1",
        skill: "SWR1",
        updatedAt: expect.any(Number),
      });
      expect(result.current.exerciseData["1"]).toEqual(sharedBefore);
      expect(result.current.exerciseProgress["SA"]).toEqual(saBefore);
    });
  });

  describe("rehydration", () => {
    it("loads a persisted state without records per skill and keeps its older record", async () => {
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

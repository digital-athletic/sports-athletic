import { act, renderHook } from "@testing-library/react-native";
import { seconds } from "@/features/training/models/TimeUnits";
import { formatDateToISO } from "@/utils/date";
import { syncManager } from "@/services/SyncManager";
import {
  CompleteWorkoutType,
  useCompletedWorkoutsStore,
} from "./completedWorkoutsStore";

jest.mock("@/services/SyncManager", () => ({
  syncManager: {
    notifyWorkoutCompleted: jest.fn(),
  },
}));

const createMockWorkout = (
  id: string,
  timestamp: number,
): CompleteWorkoutType => ({
  id,
  timestamp,
  exercises: [],
  duration: seconds(1800), // 30 minutes in seconds
});

describe("completedWorkoutsStore", () => {
  beforeEach(async () => {
    const { result } = await renderHook(() => useCompletedWorkoutsStore());
    await act(() => {
      result.current.clearWorkoutHistory();
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("has empty workouts and lists", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      expect(result.current.workoutsList).toHaveLength(0);
      expect(Object.keys(result.current.workouts)).toHaveLength(0);
    });
  });

  describe("addCompletedWorkout", () => {
    it("adds to workouts record", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      const workout = createMockWorkout("w1", Date.now());

      await act(() => {
        result.current.addCompletedWorkout(workout);
      });

      expect(result.current.workouts["w1"]).toBeDefined();
    });

    it("adds entry to workoutsList", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      const workout = createMockWorkout("w1", Date.now());

      await act(() => {
        result.current.addCompletedWorkout(workout);
      });

      expect(result.current.workoutsList).toHaveLength(1);
      expect(result.current.workoutsList[0].id).toBe("w1");
    });

    it("notifies sync of completed workout", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      const workout = createMockWorkout("w1", Date.now());

      await act(() => {
        result.current.addCompletedWorkout(workout);
      });

      expect(syncManager.notifyWorkoutCompleted).toHaveBeenCalledWith(workout);
    });
  });

  describe("getWorkoutById", () => {
    it("returns workout if exists", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      const workout = createMockWorkout("w1", Date.now());

      await act(() => {
        result.current.addCompletedWorkout(workout);
      });

      expect(result.current.getWorkoutById("w1")?.id).toBe("w1");
    });

    it("returns undefined if not found", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      expect(result.current.getWorkoutById("missing")).toBeUndefined();
    });
  });

  describe("getRecentWorkouts", () => {
    it("returns workouts sorted by timestamp descending", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());

      await act(() => {
        result.current.addCompletedWorkout(createMockWorkout("w1", 1000));
        result.current.addCompletedWorkout(createMockWorkout("w2", 3000));
        result.current.addCompletedWorkout(createMockWorkout("w3", 2000));
      });

      const recent = result.current.getRecentWorkouts(3);
      expect(recent[0].id).toBe("w2"); // most recent first
    });

    it("limits to specified count", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());

      await act(() => {
        result.current.addCompletedWorkout(createMockWorkout("w1", 1000));
        result.current.addCompletedWorkout(createMockWorkout("w2", 2000));
        result.current.addCompletedWorkout(createMockWorkout("w3", 3000));
      });

      expect(result.current.getRecentWorkouts(2)).toHaveLength(2);
    });
  });

  describe("getTotalWorkouts", () => {
    it("returns count of workouts", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());

      await act(() => {
        result.current.addCompletedWorkout(createMockWorkout("w1", 1000));
        result.current.addCompletedWorkout(createMockWorkout("w2", 2000));
      });

      expect(result.current.getTotalWorkouts()).toBe(2);
    });
  });

  describe("getTotalTrainingTime", () => {
    it("sums duration across all workouts", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());

      await act(() => {
        result.current.addCompletedWorkout({
          ...createMockWorkout("w1", 1000),
          duration: seconds(1800),
        });
        result.current.addCompletedWorkout({
          ...createMockWorkout("w2", 2000),
          duration: seconds(3600),
        });
      });

      expect(result.current.getTotalTrainingTime()).toBe(5400);
    });
  });

  describe("addCompletedTrainingPlan", () => {
    it("appends to trainingPlans array", async () => {
      const { result } = await renderHook(() => useCompletedWorkoutsStore());
      const plan = { start: formatDateToISO(new Date()), sections: [] };

      await act(() => {
        result.current.addCompletedTrainingPlan(plan);
      });

      expect(result.current.trainingPlans).toHaveLength(1);
    });
  });
});

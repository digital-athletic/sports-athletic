import { act, renderHook } from "@testing-library/react-native";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { seconds } from "@/features/training/models/TimeUnits";
import { useStatisticsWorkouts } from "./useStatisticsWorkouts";

describe("useStatisticsWorkouts", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCompletedWorkoutsStore());
    act(() => {
      result.current.clearWorkoutHistory();
    });
  });

  it("returns empty array when no workouts", () => {
    const { result } = renderHook(() => useStatisticsWorkouts());
    expect(result.current).toEqual([]);
  });

  it("returns workouts from store", () => {
    const { result: storeResult } = renderHook(() =>
      useCompletedWorkoutsStore(),
    );

    act(() => {
      storeResult.current.addCompletedWorkout({
        id: "w1",
        timestamp: 1000,
        exercises: [],
        duration: seconds(1800),
        xpEarned: 100,
        exerciseCount: 5,
        movedWeight: 500,
        userSkills: {
          PREVENTION: 0,
          MOBILITY: 1,
          SWR: 3,
          WARMUP: 0,
          STABILITY: 1,
          CARDIO: 0,
        },
      });
    });

    const { result } = renderHook(() => useStatisticsWorkouts());

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      id: "w1",
      timestamp: 1000,
      duration: 1800,
      xpEarned: 100,
      exerciseCount: 5,
      movedWeight: 500,
    });
  });

  it("sorts workouts by timestamp descending", () => {
    const { result: storeResult } = renderHook(() =>
      useCompletedWorkoutsStore(),
    );

    act(() => {
      storeResult.current.addCompletedWorkout({
        id: "w1",
        timestamp: 1000,
        exercises: [],
        duration: seconds(1800),
      });
      storeResult.current.addCompletedWorkout({
        id: "w2",
        timestamp: 3000,
        exercises: [],
        duration: seconds(1800),
      });
    });

    const { result } = renderHook(() => useStatisticsWorkouts());

    expect(result.current[0].id).toBe("w2");
    expect(result.current[1].id).toBe("w1");
  });
});

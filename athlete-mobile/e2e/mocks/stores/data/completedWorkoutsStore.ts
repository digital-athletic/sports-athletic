/**
 * Completed workouts store - history of finished workouts.
 */

import type {
  CompletedWorkoutsState,
  CompletedWorkout,
  StoreState,
} from "../types";

/**
 * Creates a sample completed workout with realistic data.
 * @param id - Unique workout identifier
 * @param timestampOffset - Milliseconds to subtract from current time (for staggered workouts)
 */
export function createSampleWorkout(
  id: string,
  timestampOffset: number = 0,
): CompletedWorkout {
  const now = Date.now();
  // Pre-calculated totals matching the exercises:
  // - 2 exercises total (exerciseCount)
  // - Weight: 15kg x 10 reps x 3 sets = 450kg (movedWeight)
  return {
    id,
    timestamp: now - timestampOffset,
    duration: 1800, // 30 minutes
    xpEarned: 50,
    exerciseCount: 2,
    movedWeight: 450, // 15kg x 10 reps x 3 sets
    exercises: [
      {
        exerciseId: "118",
        skill: "SWR1",
        weight: 15,
        repetition: 10,
        set: [3, 3],
      },
      {
        exerciseId: "431",
        skill: "WU",
        repetition: 10,
        set: [1, 1],
      },
    ],
  };
}

export interface CompletedWorkoutsStoreOptions {
  workouts?: Record<string, CompletedWorkout>;
}

export function createCompletedWorkoutsStore(
  options: CompletedWorkoutsStoreOptions = {},
): StoreState<CompletedWorkoutsState> {
  const { workouts = {} } = options;

  return {
    state: {
      workouts,
    },
  };
}

/**
 * Creates a store with a specified number of sample workouts.
 * @param count - Number of workouts to generate
 */
export function createCompletedWorkoutsStoreWithCount(
  count: number,
): StoreState<CompletedWorkoutsState> {
  const workouts: Record<string, CompletedWorkout> = {};
  for (let i = 0; i < count; i++) {
    const workout = createSampleWorkout(
      `workout-${i + 1}`,
      i * 60 * 60 * 1000, // 1 hour offset per workout
    );
    workouts[workout.id] = workout;
  }
  return createCompletedWorkoutsStore({ workouts });
}

/**
 * Creates a sample workout with xpEarned: 0 but valid other stats.
 * Used to test the bug where workouts with 0 XP were incorrectly
 * marked as "test workouts" and had their summary hidden.
 */
export function createZeroXpWorkout(
  id: string,
  timestampOffset: number = 0,
): CompletedWorkout {
  const now = Date.now();
  return {
    id,
    timestamp: now - timestampOffset,
    duration: 1200, // 20 minutes
    xpEarned: 0, // Zero XP - the bug scenario
    exerciseCount: 3,
    movedWeight: 300,
    exercises: [
      {
        exerciseId: "118",
        skill: "SWR1",
        weight: 10,
        repetition: 10,
        set: [3, 3],
      },
    ],
  };
}

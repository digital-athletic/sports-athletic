import { useAuthStore } from "@/store/authStore";
import { useSyncQueueStore, type SyncQueueItem } from "@/store/syncQueueStore";
import type {
  CompleteWorkoutType,
  UserExerciseDataType,
} from "@/schemas/sync.schema";
import type { MaxValuesType } from "@/schemas/user.schema";
import {
  processQueue,
  processSingleItem,
  syncCompletedWorkout,
  syncExerciseData,
  syncStrengthTest,
  getBackoffDelay,
  resetProcessingFlag,
} from "./SyncService";

const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn((_table: string) => ({
  upsert: mockUpsert,
  insert: mockInsert,
}));

jest.mock("./supabaseClient", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

jest.mock("./Logger", () => ({
  Logger: {
    logError: jest.fn(),
    logEvent: jest.fn(),
  },
}));

const TEST_USER_ID = "user-abc-123";

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
  resetProcessingFlag();
  useSyncQueueStore.getState().clearAll();
  useAuthStore.getState().setAuth({
    userId: TEST_USER_ID,
    token: "test-token",
  });
});

describe("getBackoffDelay", () => {
  it.each([
    [0, 1000],
    [1, 2000],
    [2, 4000],
    [3, 8000],
  ])("attempt %i returns %ims", (attempt, expected) => {
    expect(getBackoffDelay(attempt)).toBe(expected);
  });

  it.each([5, 10])("caps at 30s for attempt %i", (attempt) => {
    expect(getBackoffDelay(attempt)).toBe(30_000);
  });
});

describe("syncCompletedWorkout", () => {
  it("maps client fields to DB columns correctly", async () => {
    const payload: CompleteWorkoutType = {
      id: "workout-1",
      timestamp: 1700000000,
      exercises: [{ exerciseId: "ex-1", skill: "SWR1" }],
      duration: 1800,
      xpEarned: 150,
      movedWeight: 5000.5,
      exerciseCount: 12,
      userSkills: { PUSH: 3, PULL: 2 },
    };

    await syncCompletedWorkout(payload, TEST_USER_ID);

    expect(mockFrom).toHaveBeenCalledWith("user_completed_workouts");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: TEST_USER_ID,
        workout_id: "workout-1",
        workout_date: 1700000000,
        duration: 1800,
        exercise_count: 12,
        xp_earned: 150,
        moved_weight: 5000.5,
        exercises: [{ exerciseId: "ex-1", skill: "SWR1" }],
        user_skills: { PUSH: 3, PULL: 2 },
      },
      { onConflict: "user_id,workout_id" },
    );
  });

  it("sets optional fields to null when missing", async () => {
    const payload: CompleteWorkoutType = {
      id: "workout-2",
      timestamp: 1700000000,
      exercises: [],
      duration: 600,
    };

    await syncCompletedWorkout(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        exercise_count: null,
        xp_earned: null,
        moved_weight: null,
        user_skills: null,
      }),
      expect.any(Object),
    );
  });

  it("throws on Supabase error", async () => {
    mockUpsert.mockResolvedValueOnce({
      error: { message: "RLS violation" },
    });

    const payload: CompleteWorkoutType = {
      id: "w1",
      timestamp: 1000,
      exercises: [],
      duration: 100,
    };

    await expect(syncCompletedWorkout(payload, TEST_USER_ID)).rejects.toThrow(
      "Failed to sync workout: RLS violation",
    );
  });
});

describe("syncExerciseData", () => {
  it("destructures SetTuple into flat columns", async () => {
    const payload = {
      exerciseId: "ex-1",
      skill: "SWR1" as const,
      set: [3, 5] as [number, number],
      workoutId: "workout-1",
    };

    await syncExerciseData(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        set_active_run: 3,
        set_num_of_sets: 5,
        workout_id: "workout-1",
      }),
      expect.any(Object),
    );
  });

  it("flattens feedback object", async () => {
    const payload = {
      exerciseId: "ex-2",
      skill: "MOB" as const,
      workoutId: "workout-1",
      feedback: {
        difficulty: "TOO_HARD" as const,
        streakCounter: 2,
      },
    };

    await syncExerciseData(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback_difficulty: "TOO_HARD",
        feedback_streak_counter: 2,
      }),
      expect.any(Object),
    );
  });

  it("maps all fields to DB columns", async () => {
    const payload: UserExerciseDataType = {
      exerciseId: "ex-3",
      workoutId: "workout-99",
      skill: "SWR1",
      repetition: 10,
      weight: 80,
      duration: 30,
      height: 1.5,
      weightType: "barbell",
      nextWeightPercentage: 0.05,
      skipped: false,
      branchId: "branch-1",
      maxFLevelAdjustment: null,
      maxFRepetitions: [{ level: "EASY", repetitions: 5 }],
    };

    await syncExerciseData(payload, TEST_USER_ID);

    expect(mockFrom).toHaveBeenCalledWith("user_exercises");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: TEST_USER_ID,
        exercise_id: "ex-3",
        workout_id: "workout-99",
        repetition: 10,
        weight: 80,
        duration: 30,
        height: 1.5,
        weight_type: "barbell",
        next_weight_percentage: 0.05,
        set_active_run: null,
        set_num_of_sets: null,
        skipped: false,
        skill: "SWR1",
        branch_id: "branch-1",
        feedback_difficulty: null,
        feedback_streak_counter: null,
        max_f_level_adjustment: null,
        max_f_repetitions: [{ level: "EASY", repetitions: 5 }],
      },
      { onConflict: "user_id,exercise_id,workout_id" },
    );
  });

  it("defaults workout_id to 'legacy' when workoutId is missing", async () => {
    const payload = {
      exerciseId: "ex-4",
      skill: "WU" as const,
    };

    await syncExerciseData(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ workout_id: "legacy" }),
      { onConflict: "user_id,exercise_id,workout_id" },
    );
  });
});

describe("syncStrengthTest", () => {
  it("maps camelCase to snake_case columns", async () => {
    const payload: MaxValuesType = {
      testDate: "2024-01-15",
      verticalPush: { barbell: 60 },
      verticalPull: { barbell: 50 },
      horizontalPush: { barbell: 80 },
      horizontalPull: { barbell: 70 },
      hip: { barbell: 100 },
      knee: { barbell: 90 },
      lowerBody: { barbell: 120 },
    };

    await syncStrengthTest(payload, TEST_USER_ID);

    expect(mockFrom).toHaveBeenCalledWith("strength_tests");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: TEST_USER_ID,
        test_date: "2024-01-15",
        vertical_push: { barbell: 60 },
        vertical_pull: { barbell: 50 },
        horizontal_push: { barbell: 80 },
        horizontal_pull: { barbell: 70 },
        hip_hinge: { barbell: 100 },
        knee_dominant: { barbell: 90 },
        lower_body: { barbell: 120 },
      },
      { onConflict: "user_id,test_date" },
    );
  });
});

describe("processSingleItem", () => {
  it("marks completed on success", async () => {
    const item: SyncQueueItem = {
      id: "q1",
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {
        id: "w1",
        timestamp: 1000,
        exercises: [],
        duration: 100,
      },
      status: "PENDING",
      createdAt: Date.now(),
      attemptCount: 0,
    };

    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: item.payload,
    });

    const queueItem = useSyncQueueStore.getState().queue[0];
    await processSingleItem(queueItem, TEST_USER_ID);

    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it("marks failed on error", async () => {
    mockUpsert.mockResolvedValueOnce({
      error: { message: "DB error" },
    });

    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: {
        id: "w1",
        timestamp: 1000,
        exercises: [],
        duration: 100,
      },
    });

    const queueItem = useSyncQueueStore.getState().queue[0];
    await processSingleItem(queueItem, TEST_USER_ID);

    const queue = useSyncQueueStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toEqual(
      expect.objectContaining({
        status: "FAILED",
        error: expect.stringContaining("DB error"),
      }),
    );
  });
});

describe("processQueue", () => {
  it("skips when not authenticated", async () => {
    useAuthStore.getState().clearAuth();
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
    });

    await processQueue();

    expect(mockFrom).not.toHaveBeenCalled();
    expect(useSyncQueueStore.getState().queue).toHaveLength(1);
  });

  it("processes all pending items", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
    });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w2",
      payload: { id: "w2", timestamp: 2000, exercises: [], duration: 200 },
    });

    await processQueue();

    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it("handles empty queue without errors", async () => {
    await processQueue();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("guards against concurrent execution", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
    });

    await Promise.all([processQueue(), processQueue()]);

    // Both should complete without error; only one processes items
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });
});

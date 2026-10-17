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

// Rewinds an item's last attempt far past any retry backoff window
function backdateLastAttempt(itemId: string): void {
  useSyncQueueStore.setState((state) => {
    const item = state.queue.find((i) => i.id === itemId);
    if (item) item.lastAttemptAt = Date.now() - 60 * 60 * 1000;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
  resetProcessingFlag();
  useSyncQueueStore.setState({ queue: [] });
  useAuthStore.getState().setAuth({
    userId: TEST_USER_ID,
  });
  delete process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED;
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
      tooHardCount: 1,
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
        too_hard_count: 1,
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

  it("maps a reset record to null value columns", async () => {
    const payload: UserExerciseDataType = {
      exerciseId: "ex-5",
      workoutId: "workout-7",
      skill: "MAX_STRENGTH",
      branchId: "branch-2",
    };

    await syncExerciseData(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: TEST_USER_ID,
        exercise_id: "ex-5",
        workout_id: "workout-7",
        repetition: null,
        weight: null,
        duration: null,
        height: null,
        weight_type: null,
        next_weight_percentage: null,
        set_active_run: null,
        set_num_of_sets: null,
        skipped: null,
        skill: "MAX_STRENGTH",
        branch_id: "branch-2",
        feedback_difficulty: null,
        feedback_streak_counter: null,
        max_f_level_adjustment: null,
        max_f_repetitions: null,
        too_hard_count: null,
      },
      { onConflict: "user_id,exercise_id,workout_id" },
    );
  });
});

describe("syncStrengthTest", () => {
  it("maps camelCase to snake_case columns", async () => {
    const testTimestamp = new Date("2024-01-15").getTime();
    const payload: MaxValuesType = {
      testAt: testTimestamp,
      verticalPush: { barbell: 60 },
      verticalPull: { barbell: 50 },
      horizontalPush: { barbell: 80 },
      horizontalPull: { barbell: 70 },
      hipHinge: { barbell: 100 },
      kneeDominant: { barbell: 90 },
      lowerBody: { barbell: 120 },
    };

    await syncStrengthTest(payload, TEST_USER_ID);

    expect(mockFrom).toHaveBeenCalledWith("strength_tests");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: TEST_USER_ID,
        test_at: testTimestamp,
        vertical_push: { barbell: 60 },
        vertical_pull: { barbell: 50 },
        horizontal_push: { barbell: 80 },
        horizontal_pull: { barbell: 70 },
        hip_hinge: { barbell: 100 },
        knee_dominant: { barbell: 90 },
        lower_body: { barbell: 120 },
      },
      { onConflict: "user_id,test_at" },
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
      ownerUserId: TEST_USER_ID,
      status: "PENDING",
      createdAt: Date.now(),
      attemptCount: 0,
    };

    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: item.payload,
      ownerUserId: TEST_USER_ID,
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
      ownerUserId: TEST_USER_ID,
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

describe("activity-only mode", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED = "true";
  });

  it("removes EXERCISE_DATA items from queue without syncing them", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "EXERCISE_DATA",
      referenceId: "ex-1",
      payload: { exerciseId: "ex-1", skill: "SWR1" },
      ownerUserId: TEST_USER_ID,
    });

    const item = useSyncQueueStore.getState().queue[0];
    await processSingleItem(item, TEST_USER_ID);

    expect(mockFrom).not.toHaveBeenCalled();
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it("syncs STRENGTH_TEST to DB with null weight columns in activity-only mode", async () => {
    const testTimestamp = new Date("2024-01-15").getTime();
    useSyncQueueStore.getState().enqueue({
      type: "STRENGTH_TEST",
      referenceId: "st-1",
      payload: {
        testAt: testTimestamp,
        verticalPush: { barbell: 60 },
        verticalPull: { barbell: 50 },
        horizontalPush: { barbell: 80 },
        horizontalPull: { barbell: 70 },
        hipHinge: { barbell: 100 },
        kneeDominant: { barbell: 90 },
        lowerBody: { barbell: 120 },
      },
      ownerUserId: TEST_USER_ID,
    });

    const item = useSyncQueueStore.getState().queue[0];
    await processSingleItem(item, TEST_USER_ID);

    expect(mockFrom).toHaveBeenCalledWith("strength_tests");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        test_at: testTimestamp,
        vertical_push: null,
        vertical_pull: null,
        horizontal_push: null,
        horizontal_pull: null,
        hip_hinge: null,
        knee_dominant: null,
        lower_body: null,
      }),
      expect.any(Object),
    );
  });

  it("strips exercises and movedWeight from COMPLETED_WORKOUT payload", async () => {
    const payload: CompleteWorkoutType = {
      id: "workout-1",
      timestamp: 1700000000,
      exercises: [{ exerciseId: "ex-1", skill: "SWR1" }],
      duration: 1800,
      xpEarned: 150,
      movedWeight: 5000.5,
      exerciseCount: 12,
    };

    await syncCompletedWorkout(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: null,
        moved_weight: null,
        xp_earned: null,
        exercise_count: 12,
        duration: 1800,
      }),
      expect.any(Object),
    );
  });

  it("processes COMPLETED_WORKOUT items normally when activity-only is off", async () => {
    delete process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED;
    const payload: CompleteWorkoutType = {
      id: "workout-2",
      timestamp: 1700000000,
      exercises: [{ exerciseId: "ex-1", skill: "SWR1" }],
      duration: 1800,
      movedWeight: 5000.5,
    };

    await syncCompletedWorkout(payload, TEST_USER_ID);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: [{ exerciseId: "ex-1", skill: "SWR1" }],
        moved_weight: 5000.5,
      }),
      expect.any(Object),
    );
  });

  it("processQueue removes EXERCISE_DATA items without syncing them", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "EXERCISE_DATA",
      referenceId: "ex-1",
      payload: { exerciseId: "ex-1", skill: "SWR1" },
      ownerUserId: TEST_USER_ID,
    });

    await processQueue();

    expect(mockFrom).not.toHaveBeenCalled();
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it("processQueue syncs COMPLETED_WORKOUT and removes EXERCISE_DATA in same queue", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
      ownerUserId: TEST_USER_ID,
    });
    useSyncQueueStore.getState().enqueue({
      type: "EXERCISE_DATA",
      referenceId: "ex-1",
      payload: { exerciseId: "ex-1", skill: "SWR1" },
      ownerUserId: TEST_USER_ID,
    });

    await processQueue();

    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
    expect(mockFrom).toHaveBeenCalledWith("user_completed_workouts");
  });

  it("processes COMPLETED_WORKOUT when EXERCISE_DATA items are queued before it", async () => {
    // Real-world order: exercises are updated during training (before workout completion)
    useSyncQueueStore.getState().enqueue({
      type: "EXERCISE_DATA",
      referenceId: "ex-1",
      payload: { exerciseId: "ex-1", skill: "SWR1" },
      ownerUserId: TEST_USER_ID,
    });
    useSyncQueueStore.getState().enqueue({
      type: "EXERCISE_DATA",
      referenceId: "ex-2",
      payload: { exerciseId: "ex-2", skill: "SWR1" },
      ownerUserId: TEST_USER_ID,
    });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
      ownerUserId: TEST_USER_ID,
    });

    await processQueue();

    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
    expect(mockFrom).toHaveBeenCalledWith("user_completed_workouts");
  });
});

describe("processQueue", () => {
  it("skips when not authenticated", async () => {
    useAuthStore.getState().clearAuth();
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
      ownerUserId: TEST_USER_ID,
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
      ownerUserId: TEST_USER_ID,
    });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w2",
      payload: { id: "w2", timestamp: 2000, exercises: [], duration: 200 },
      ownerUserId: TEST_USER_ID,
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
      ownerUserId: TEST_USER_ID,
    });

    await Promise.all([processQueue(), processQueue()]);

    // Both should complete without error; only one processes items
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });
});

describe("processQueue: item owner", () => {
  const workoutPayload = {
    id: "w1",
    timestamp: 1000,
    exercises: [],
    duration: 100,
  };

  it("does not upload an item of A while B is logged in", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: workoutPayload,
      ownerUserId: "user-a",
    });

    useAuthStore.getState().setAuth({ userId: "user-b" });
    await processQueue();

    expect(mockUpsert).not.toHaveBeenCalled();
    expect(useSyncQueueStore.getState().queue).toHaveLength(1);
  });

  it("uploads an item of A after A logs in", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: workoutPayload,
      ownerUserId: "user-a",
    });

    useAuthStore.getState().setAuth({ userId: "user-a" });
    await processQueue();

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-a" }),
      expect.any(Object),
    );
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it("claims an unowned item for the first user", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: workoutPayload,
      ownerUserId: null,
    });
    mockUpsert.mockResolvedValueOnce({ error: { message: "offline" } });

    useAuthStore.getState().setAuth({ userId: "user-a" });
    await processQueue();

    expect(useSyncQueueStore.getState().queue[0].ownerUserId).toBe("user-a");
  });

  it("uploads an unowned item under the first user", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: workoutPayload,
      ownerUserId: null,
    });

    useAuthStore.getState().setAuth({ userId: "user-a" });
    await processQueue();

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-a" }),
      expect.any(Object),
    );
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });

  it("keeps a claimed item with its first user", async () => {
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: workoutPayload,
      ownerUserId: null,
    });
    mockUpsert.mockResolvedValueOnce({ error: { message: "offline" } });

    useAuthStore.getState().setAuth({ userId: "user-a" });
    await processQueue();
    useAuthStore.getState().setAuth({ userId: "user-b" });
    await processQueue();

    expect(useSyncQueueStore.getState().queue[0].ownerUserId).toBe("user-a");
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it("stops the loop when the auth user changes during an upload", async () => {
    useAuthStore.getState().setAuth({ userId: "user-a" });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: workoutPayload,
      ownerUserId: "user-a",
    });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w2",
      payload: { ...workoutPayload, id: "w2" },
      ownerUserId: "user-a",
    });

    let finishUpload: (value: { error: null }) => void = () => undefined;
    mockUpsert.mockReturnValueOnce(
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
    );

    const run = processQueue();
    useAuthStore.getState().setAuth({ userId: "user-b" });
    finishUpload({ error: null });
    await run;

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(useSyncQueueStore.getState().queue).toHaveLength(1);
    expect(useSyncQueueStore.getState().queue[0].referenceId).toBe("w2");
  });

  it("keeps the run of the new user exclusive when the run of the old user finishes late", async () => {
    let finishUploadA: (value: { error: null }) => void = () => undefined;
    let finishUploadB: (value: { error: null }) => void = () => undefined;
    mockUpsert
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishUploadA = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishUploadB = resolve;
        }),
      );

    useAuthStore.getState().setAuth({ userId: "user-a" });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "wA",
      payload: { ...workoutPayload, id: "wA" },
      ownerUserId: "user-a",
    });
    const runA = processQueue();

    // A user switch restarts the SyncManager, which resets the flag
    useAuthStore.getState().setAuth({ userId: "user-b" });
    resetProcessingFlag();
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "wB1",
      payload: { ...workoutPayload, id: "wB1" },
      ownerUserId: "user-b",
    });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "wB2",
      payload: { ...workoutPayload, id: "wB2" },
      ownerUserId: "user-b",
    });
    const runB = processQueue();

    finishUploadA({ error: null });
    await runA;
    await processQueue();

    expect(mockUpsert).toHaveBeenCalledTimes(2);

    finishUploadB({ error: null });
    await runB;

    expect(mockUpsert).toHaveBeenCalledTimes(3);
    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });
});

describe("processQueue: retry of failed items", () => {
  it("retries a failed item on a later run and completes it", async () => {
    mockUpsert.mockResolvedValueOnce({
      error: { message: "Temporary server error" },
    });

    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
      ownerUserId: TEST_USER_ID,
    });

    await processQueue();

    const failedItem = useSyncQueueStore.getState().queue[0];
    expect(failedItem.status).toBe("FAILED");

    backdateLastAttempt(failedItem.id);

    await processQueue();

    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

  it("drains a queue holding only failed items with attempts left", async () => {
    mockUpsert
      .mockResolvedValueOnce({ error: { message: "Temporary server error" } })
      .mockResolvedValueOnce({ error: { message: "Temporary server error" } });

    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w1",
      payload: { id: "w1", timestamp: 1000, exercises: [], duration: 100 },
      ownerUserId: TEST_USER_ID,
    });
    useSyncQueueStore.getState().enqueue({
      type: "COMPLETED_WORKOUT",
      referenceId: "w2",
      payload: { id: "w2", timestamp: 2000, exercises: [], duration: 200 },
      ownerUserId: TEST_USER_ID,
    });

    await processQueue();

    expect(
      useSyncQueueStore.getState().queue.every((i) => i.status === "FAILED"),
    ).toBe(true);

    for (const item of useSyncQueueStore.getState().queue) {
      backdateLastAttempt(item.id);
    }

    await processQueue();

    expect(useSyncQueueStore.getState().queue).toHaveLength(0);
  });
});

import { useAuthStore } from "@/store/authStore";
import {
  useSyncQueueStore,
  MAX_RETRY_ATTEMPTS,
  type SyncQueueItem,
} from "@/store/syncQueueStore";
import {
  CompleteWorkoutSchema,
  UserExerciseDataSchema,
  type CompleteWorkoutType,
  type UserExerciseDataType,
} from "@/schemas/sync.schema";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { MaxValuesSchema } from "@/schemas/user.schema";
import * as v from "valibot";
import { supabase } from "./supabaseClient";
import { Logger } from "./Logger";
import { featureFlags } from "@/config/featureFlags";

function isActivityOnlyMode(): boolean {
  return featureFlags.serverSyncActivityOnlyEnabled;
}

let runningQueue: Promise<void> | null = null;

export function getBackoffDelay(attemptCount: number): number {
  const baseDelay = 1000;
  return Math.min(baseDelay * Math.pow(2, attemptCount), 30_000);
}

export async function processQueue(): Promise<void> {
  if (runningQueue) {
    return;
  }

  const startUserId = useAuthStore.getState().auth?.userId;
  if (!startUserId) {
    return;
  }

  const run = runQueue(startUserId);
  runningQueue = run;
  try {
    await run;
  } finally {
    // After a user switch a newer run may own the flag; leave it set
    if (runningQueue === run) {
      runningQueue = null;
    }
  }
}

async function runQueue(userId: string): Promise<void> {
  const attemptedIds = new Set<string>();

  // Stop when the user changed; items upload only under their owner
  while (useAuthStore.getState().auth?.userId === userId) {
    const store = useSyncQueueStore.getState();
    const item = store.getNextPending(userId);
    if (!item || attemptedIds.has(item.id)) {
      break;
    }
    attemptedIds.add(item.id);
    if (item.ownerUserId === null) {
      store.claimItem(item.id, userId);
    }
    await processSingleItem(item, userId);
  }
}

export async function processSingleItem(
  item: SyncQueueItem,
  userId: string,
): Promise<void> {
  const store = useSyncQueueStore.getState();

  if (item.attemptCount >= MAX_RETRY_ATTEMPTS) {
    return;
  }

  if (isActivityOnlyMode() && item.type === "EXERCISE_DATA") {
    store.markCompleted(item.id);
    return;
  }

  store.markInProgress(item.id);

  try {
    switch (item.type) {
      case "COMPLETED_WORKOUT": {
        const payload = v.parse(CompleteWorkoutSchema, item.payload);
        await syncCompletedWorkout(payload, userId);
        break;
      }
      case "EXERCISE_DATA": {
        const payload = v.parse(UserExerciseDataSchema, item.payload);
        await syncExerciseData(payload, userId);
        break;
      }
      case "STRENGTH_TEST": {
        const payload = v.parse(MaxValuesSchema, item.payload);
        await syncStrengthTest(payload, userId);
        break;
      }
    }
    store.markCompleted(item.id);
  } catch (error) {
    const isValidationError = error instanceof v.ValiError;
    const message = isValidationError
      ? "Invalid payload data"
      : error instanceof Error
        ? error.message
        : "Unknown sync error";
    store.markFailed(item.id, message);
    Logger.logError(error instanceof Error ? error : new Error(message));
  }
}

export async function syncCompletedWorkout(
  payload: CompleteWorkoutType,
  userId: string,
): Promise<void> {
  const activityOnly = isActivityOnlyMode();
  const row = {
    user_id: userId,
    workout_id: payload.id,
    workout_date: payload.timestamp,
    duration: payload.duration,
    exercise_count: payload.exerciseCount ?? null,
    xp_earned: activityOnly ? null : (payload.xpEarned ?? null),
    moved_weight: activityOnly ? null : (payload.movedWeight ?? null),
    exercises: activityOnly ? null : payload.exercises,
    user_skills: payload.userSkills ?? null,
  };

  const { error } = await supabase
    .from("user_completed_workouts")
    .upsert(row, { onConflict: "user_id,workout_id" });

  if (error) {
    throw new Error(`Failed to sync workout: ${error.message}`);
  }

  Logger.logEvent("sync:completed_workout", {
    workoutId: payload.id,
    duration: payload.duration,
    exerciseCount: payload.exerciseCount,
  });
}

export async function syncExerciseData(
  payload: UserExerciseDataType,
  userId: string,
): Promise<void> {
  const row = {
    user_id: userId,
    exercise_id: payload.exerciseId,
    workout_id: payload.workoutId ?? "legacy",
    repetition: payload.repetition ?? null,
    weight: payload.weight ?? null,
    duration: payload.duration ?? null,
    height: payload.height ?? null,
    weight_type: payload.weightType ?? null,
    next_weight_percentage: payload.nextWeightPercentage ?? null,
    set_active_run: payload.set?.[0] ?? null,
    set_num_of_sets: payload.set?.[1] ?? null,
    skipped: payload.skipped ?? null,
    skill: payload.skill,
    branch_id: payload.branchId ?? null,
    feedback_difficulty: payload.feedback?.difficulty ?? null,
    feedback_streak_counter: payload.feedback?.streakCounter ?? null,
    max_f_level_adjustment: payload.maxFLevelAdjustment ?? null,
    max_f_repetitions: payload.maxFRepetitions ?? null,
    too_hard_count: payload.tooHardCount ?? null,
  };

  const { error } = await supabase
    .from("user_exercises")
    .upsert(row, { onConflict: "user_id,exercise_id,workout_id,skill" });

  if (error) {
    throw new Error(`Failed to sync exercise data: ${error.message}`);
  }

  Logger.logEvent("sync:exercise_data", {
    exerciseId: payload.exerciseId,
    workoutId: payload.workoutId,
    skill: payload.skill,
  });
}

export async function syncStrengthTest(
  payload: MaxValuesType,
  userId: string,
): Promise<void> {
  const activityOnly = isActivityOnlyMode();
  const row = {
    user_id: userId,
    test_at: payload.testAt,
    vertical_push: activityOnly ? null : payload.verticalPush,
    vertical_pull: activityOnly ? null : payload.verticalPull,
    horizontal_push: activityOnly ? null : payload.horizontalPush,
    horizontal_pull: activityOnly ? null : payload.horizontalPull,
    hip_hinge: activityOnly ? null : payload.hipHinge,
    knee_dominant: activityOnly ? null : payload.kneeDominant,
    lower_body: activityOnly ? null : payload.lowerBody,
  };

  const { error } = await supabase
    .from("strength_tests")
    .upsert(row, { onConflict: "user_id,test_at" });

  if (error) {
    throw new Error(`Failed to sync strength test: ${error.message}`);
  }

  Logger.logEvent("sync:strength_test", {
    testAt: payload.testAt,
    row,
  });
}

export function resetProcessingFlag(): void {
  runningQueue = null;
}

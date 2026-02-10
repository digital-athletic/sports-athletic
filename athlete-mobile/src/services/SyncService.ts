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

let isProcessing = false;

export function getBackoffDelay(attemptCount: number): number {
  const baseDelay = 1000;
  return Math.min(baseDelay * Math.pow(2, attemptCount), 30_000);
}

export async function processQueue(): Promise<void> {
  if (isProcessing) {
    return;
  }

  const auth = useAuthStore.getState().auth;
  if (!auth) {
    return;
  }

  isProcessing = true;

  try {
    const store = useSyncQueueStore.getState();
    let nextItem = store.getNextPending();

    while (nextItem) {
      await processSingleItem(nextItem, auth.userId);
      nextItem = useSyncQueueStore.getState().getNextPending();
    }
  } finally {
    isProcessing = false;
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

  if (item.attemptCount > 0) {
    const delay = getBackoffDelay(item.attemptCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
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
  const row = {
    user_id: userId,
    workout_id: payload.id,
    workout_date: payload.timestamp,
    duration: payload.duration,
    exercise_count: payload.exerciseCount ?? null,
    xp_earned: payload.xpEarned ?? null,
    moved_weight: payload.movedWeight ?? null,
    exercises: payload.exercises,
    user_skills: payload.userSkills ?? null,
  };

  const { error } = await supabase
    .from("user_completed_workouts")
    .upsert(row, { onConflict: "user_id,workout_id" });

  if (error) {
    throw new Error(`Failed to sync workout: ${error.message}`);
  }
}

export async function syncExerciseData(
  payload: UserExerciseDataType,
  userId: string,
): Promise<void> {
  const row = {
    user_id: userId,
    exercise_id: payload.exerciseId,
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
  };

  const { error } = await supabase
    .from("user_exercises")
    .upsert(row, { onConflict: "user_id,exercise_id" });

  if (error) {
    throw new Error(`Failed to sync exercise data: ${error.message}`);
  }
}

export async function syncStrengthTest(
  payload: MaxValuesType,
  userId: string,
): Promise<void> {
  const row = {
    user_id: userId,
    test_date: payload.testDate,
    vertical_push: payload.verticalPush,
    vertical_pull: payload.verticalPull,
    horizontal_push: payload.horizontalPush,
    horizontal_pull: payload.horizontalPull,
    hip: payload.hip,
    knee: payload.knee,
    lower_body: payload.lowerBody,
  };

  const { error } = await supabase.from("strength_tests").insert(row);

  if (error) {
    throw new Error(`Failed to sync strength test: ${error.message}`);
  }
}

export function resetProcessingFlag(): void {
  isProcessing = false;
}

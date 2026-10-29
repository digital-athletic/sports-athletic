import {
  accumulateExerciseTotals,
  type ExerciseTotalsMapType,
  type ExerciseTotalsType,
} from "@/features/training/models/ExerciseTotals";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import type {
  ExerciseDataMapType,
  ExerciseProgressMapType,
  ExerciseProgressRecordType,
} from "@/features/training/models/ExerciseProgress";
import { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  readOwnExerciseProgress,
  toUpdatedAt,
} from "@/features/training/utils/exerciseProgressLookup";
import type { SkillCode } from "@/schemas/generator.schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { syncManager } from "@/services/SyncManager";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { exerciseProgressStoreMigrations } from "./migrations/exerciseProgressStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export interface UserExerciseBranchDataType {
  branchId: string;
  level: number;
  /** Exercise at `level` when it was stored; reconciliation reads it after content updates. */
  exerciseId?: string;
  /** Decay steps already applied for the pause after the session at `since`. */
  decay?: { since: number; steps: number };
}

export type BranchDataMapType = Record<
  string,
  UserExerciseBranchDataType | undefined
>;

export type State = {
  // Exercise-level data, one record per skill
  exerciseProgress: ExerciseProgressMapType;
  // One record per exercise naming the skill that wrote it last; the legacy
  // generator and the sync read it, and it holds the progress written before
  // the records per skill existed
  exerciseData: ExerciseDataMapType;
  branchData: BranchDataMapType;

  // Exercise totals (cumulative values)
  exerciseTotals: ExerciseTotalsMapType;

  // User progression
  xp: number;
  level: number;
  testHistory: MaxValuesType[];
};

const NUMBER_KEYS = [
  "duration",
  "height",
  "nextWeightPercentage",
  "repetition",
  "weight",
  "tooHardCount",
] as const;

const createInitialState = (): State => ({
  exerciseProgress: {},
  exerciseData: {},
  branchData: {},
  exerciseTotals: {},
  xp: 0,
  level: 1,
  testHistory: [],
});

/** Writes the set fields of `data` into `target`; a repeated difficulty extends the streak. */
const mergeExerciseData = (
  target: UserExerciseDataType,
  data: UserExerciseDataType,
): void => {
  if (data.feedback) {
    target.feedback = mergeFeedback(target.feedback, data.feedback);
  }
  copyNumbers(target, data);
  copyOthers(target, data);
};

const mergeFeedback = (
  prev: UserExerciseDataType["feedback"],
  next: NonNullable<UserExerciseDataType["feedback"]>,
): NonNullable<UserExerciseDataType["feedback"]> => {
  const repeated = prev?.difficulty && prev.difficulty === next.difficulty;
  return {
    difficulty: next.difficulty,
    streakCounter: repeated ? (prev.streakCounter ?? 0) + 1 : 1,
  };
};

const copyNumbers = (
  target: UserExerciseDataType,
  data: UserExerciseDataType,
): void => {
  for (const key of NUMBER_KEYS) {
    const value = data[key];
    if (typeof value === "number") target[key] = value;
  }
};

const copyOthers = (
  target: UserExerciseDataType,
  data: UserExerciseDataType,
): void => {
  if (typeof data.branchId === "string") target.branchId = data.branchId;
  if (typeof data.skipped === "boolean") target.skipped = data.skipped;
  if (typeof data.weightType === "string") target.weightType = data.weightType;
  if (data.maxFLevelAdjustment) {
    target.maxFLevelAdjustment = data.maxFLevelAdjustment;
  }
  if (data.maxFRepetitions) target.maxFRepetitions = data.maxFRepetitions;
  if (data.set) target.set = data.set;
};

/** Merges `data` into the record of the exercise, names the writer and stamps the time. */
const writeRecord = (
  records: ExerciseDataMapType,
  exerciseId: string,
  data: UserExerciseDataType,
  updatedAt: number,
): void => {
  const record = (records[exerciseId] ??= { exerciseId, skill: data.skill });
  mergeExerciseData(record, data);
  // The record names its last writer, so readers know whose values it holds.
  record.skill = data.skill;
  record.updatedAt = updatedAt;
};

// The sync queue stores the record as the server knows it, without the local updatedAt.
const toSyncPayload = (
  { updatedAt: _updatedAt, ...record }: ExerciseProgressRecordType,
  workoutId?: string,
): UserExerciseDataType & { workoutId?: string } =>
  workoutId ? { ...record, workoutId } : record;

type Actions = {
  // Exercise Data
  setExerciseData: (data: Record<string, UserExerciseDataType>) => void;
  updateExercise: (
    exerciseId: string,
    data: UserExerciseDataType,
    workoutId?: string,
  ) => void;
  resetExercise: (
    exerciseId: string,
    data: Pick<UserExerciseDataType, "skill" | "branchId">,
    workoutId?: string,
  ) => void;
  setBranchLevel: (branchId: string, level: number, exerciseId: string) => void;
  setBranchData: (branchData: BranchDataMapType) => void;

  // Exercise Totals
  updateUserExerciseTotals: (
    exerciseId: string,
    weight?: number,
    duration?: number,
    reps?: number,
    height?: number,
  ) => void;

  // User Progress
  addXP: (amount: number) => void;
  setLevel: (level: number) => void;
  addTestResult: (result: MaxValuesType) => void;
  resetProgress: () => void;
};

type Selectors = {
  getExerciseData: (exerciseId: string) => UserExerciseDataType | undefined;
  getExerciseProgress: (
    skill: SkillCode,
    exerciseId: string,
  ) => ExerciseProgressRecordType | undefined;
  getBranchLevel: (branchId: string) => number;
  getLatestTestResult: () => MaxValuesType | undefined;
  getExerciseTotals: (exerciseId: string) => ExerciseTotalsType | undefined;
};

export type ExerciseProgressState = State & Actions & Selectors;

/**
 * Exercise Progress Store
 *
 * Combines the legacy Redux `progress` and `exerciseData` branches.
 * Manages user progression, exercise performance data, and gamification.
 *
 * @example
 * ```tsx
 * const { xp, level, addXP, updateExercise, getBranchLevel } = useExerciseProgressStore();
 *
 * // Add XP after workout completion
 * addXP(150);
 *
 * // Update exercise feedback
 * updateExercise(42, { feedback: 'HARD', weight: 20 });
 *
 * // Check branch progression level
 * const currentLevel = getBranchLevel(5);
 *
 * // Save test results
 * addTestResult({ squat: 100, pushup: 30 });
 * ```
 */
export const useExerciseProgressStore = create<ExerciseProgressState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),

      setExerciseData: (data) =>
        set((state) => {
          state.exerciseData = data;
        }),

      updateExercise: (exerciseId, data, workoutId) => {
        set((state) => {
          const updatedAt = toUpdatedAt(Date.now());
          const bySkill = (state.exerciseProgress[data.skill] ??= {});
          writeRecord(bySkill, exerciseId, data, updatedAt);
          writeRecord(state.exerciseData, exerciseId, data, updatedAt);
        });
        const record = get().exerciseProgress[data.skill]?.[exerciseId];
        if (record) {
          syncManager.notifyExerciseUpdated(
            exerciseId,
            toSyncPayload(record, workoutId),
          );
        }
      },

      // updateExercise merges and cannot drop fields; the completed workouts
      // keep the history, so the record may start over.
      resetExercise: (exerciseId, { skill, branchId }, workoutId) => {
        const record: UserExerciseDataType = { exerciseId, skill };
        if (typeof branchId === "string") {
          record.branchId = branchId;
        }
        set((state) => {
          const updatedAt = toUpdatedAt(Date.now());
          const bySkill = (state.exerciseProgress[skill] ??= {});
          bySkill[exerciseId] = { ...record, updatedAt };
          state.exerciseData[exerciseId] = { ...record, updatedAt };
        });
        syncManager.notifyExerciseUpdated(
          exerciseId,
          toSyncPayload(record, workoutId),
        );
      },

      setBranchLevel: (branchId, level, exerciseId) =>
        set((state) => {
          const branch = state.branchData[branchId];
          if (branch) {
            branch.level = level;
            branch.exerciseId = exerciseId;
          } else {
            state.branchData[branchId] = { branchId, level, exerciseId };
          }
        }),

      setBranchData: (branchData) =>
        set((state) => {
          state.branchData = branchData;
        }),

      updateUserExerciseTotals: (
        exerciseId,
        weight,
        duration,
        reps,
        height,
      ) => {
        const existing = get().exerciseTotals[exerciseId];
        const newTotals = accumulateExerciseTotals(
          existing,
          weight,
          duration,
          reps,
          height,
        );

        set((state) => {
          state.exerciseTotals[exerciseId] = newTotals;
        });

        // TODO: Add Supabase sync in the future
      },

      addXP: (amount) =>
        set((state) => {
          state.xp += amount;
          state.level = Math.floor(state.xp / 1000) + 1;
        }),

      setLevel: (level) =>
        set((state) => {
          state.level = level;
        }),

      addTestResult: (result) => {
        set((state) => {
          state.testHistory.push(result);
        });
        syncManager.notifyTestResultAdded(result);
      },

      resetProgress: () =>
        set((state) => {
          const initialState = createInitialState();
          state.exerciseProgress = initialState.exerciseProgress;
          state.exerciseData = initialState.exerciseData;
          state.branchData = initialState.branchData;
          state.exerciseTotals = initialState.exerciseTotals;
          state.xp = initialState.xp;
          state.level = initialState.level;
          state.testHistory = initialState.testHistory;
        }),

      getExerciseData: (exerciseId) => {
        const { exerciseData } = get();
        return exerciseData[exerciseId];
      },

      getExerciseProgress: (skill, exerciseId) =>
        readOwnExerciseProgress(get(), skill, exerciseId) ?? undefined,

      getBranchLevel: (branchId) => {
        const { branchData } = get();
        return branchData[branchId]?.level ?? 0;
      },

      getLatestTestResult: () => {
        const { testHistory } = get();
        return testHistory[testHistory.length - 1];
      },

      getExerciseTotals: (exerciseId) => {
        const { exerciseTotals } = get();
        return exerciseTotals[exerciseId];
      },
    })),
    {
      name: "exercise-progress-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.EXERCISE_PROGRESS,
      migrate: createMigrate(
        STORE_VERSIONS.EXERCISE_PROGRESS,
        exerciseProgressStoreMigrations,
        createInitialState,
        "exercise-progress",
      ),
    },
  ),
);

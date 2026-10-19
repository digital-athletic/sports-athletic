import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { CsvField } from "@/features/statistics/models/csv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import { deriveEntryWeight } from "@/features/training/utils/workoutUtils";
import type { UserExerciseDataType } from "@/schemas/sync.schema";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { dateToHHMM, formatDateToISO } from "@/utils/date";
import { getTagValues } from "@/utils/tagUtils";
import type { TFunction } from "i18next";

export type ExportKind = "workouts" | "strength-tests";

const round2 = (value: number): number => Math.round(value * 100) / 100;

const roundOrNull = (value: number | undefined): number | null =>
  value === undefined ? null : round2(value);

/** Local date-time as YYYY-MM-DDTHH:mm:ss. */
const formatLocalDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const secs = String(date.getSeconds()).padStart(2, "0");
  return `${formatDateToISO(date)}T${dateToHHMM(date)}:${secs}`;
};

const WEIGHT_F_MAX = "weightFMax";

/**
 * Workouts stored before entries carried a completed flag count every set
 * except pauses and skipped ones.
 */
const performedSets = (
  entries: UserExerciseDataType[],
): UserExerciseDataType[] => {
  const tracksCompletion = entries.some(
    (entry) => entry.completed !== undefined,
  );
  return entries.filter(
    (entry) =>
      !isPauseExercise(entry.exerciseId) &&
      entry.skipped !== true &&
      (!tracksCompletion || entry.completed === true),
  );
};

/** F-Max weights resolve against the strength test in effect on the workout date. */
const toWeightKg = (
  entry: UserExerciseDataType,
  exercise: ExerciseType | undefined,
  strengthTest: MaxValuesType | undefined,
): number | null => {
  if (!entry.weight) return null;
  if (!exercise) {
    return entry.weightType === WEIGHT_F_MAX ? null : round2(entry.weight);
  }
  return roundOrNull(
    deriveEntryWeight(
      {
        weight: entry.weight,
        weightType: entry.weightType,
        skill: entry.skill,
      },
      exercise,
      strengthTest ?? DEFAULT_MAX_VALUES,
    ),
  );
};

const exerciseName = (
  entry: UserExerciseDataType,
  exercise: ExerciseType | undefined,
): string => exercise?.displayName ?? exercise?.name ?? entry.exerciseId;

/** Strength tests mark reps as -1, which gives null like a missing count. */
const repetitionsOrNull = (entry: UserExerciseDataType): number | null =>
  entry.repetition !== undefined && entry.repetition > 0
    ? entry.repetition
    : null;

const fMaxPercentOrNull = (entry: UserExerciseDataType): number | null =>
  entry.weightType === WEIGHT_F_MAX ? entry.weight || null : null;

const DIFFICULTY_LABEL_KEYS = {
  TOO_EASY: "statistics.export.difficulty.tooEasy",
  TOO_HARD: "statistics.export.difficulty.tooHard",
  SUCCEEDED: "statistics.export.difficulty.succeeded",
} as const;

/** Dumbbell exercises show the load of one dumbbell, as in the training screen. */
const toWeightType = (
  exercise: ExerciseType | undefined,
  weightKg: number | null,
  t: TFunction,
): string | null => {
  if (weightKg === null) return null;
  const isDumbbell =
    exercise !== undefined &&
    getTagValues(exercise.tags, TagGroups.EQUIPMENT).includes(
      WorkoutConstants.EQUIPMENT.DUMBBELL,
    );
  return isDumbbell
    ? t("statistics.export.weightType.perDumbbell")
    : t("statistics.export.weightType.total");
};

const toDifficulty = (
  entry: UserExerciseDataType,
  t: TFunction,
): string | null => {
  const difficulty = entry.feedback?.difficulty;
  return difficulty ? t(DIFFICULTY_LABEL_KEYS[difficulty]) : null;
};

interface SetRowContext {
  workout: CompleteWorkoutType;
  strengthTest: MaxValuesType | undefined;
  t: TFunction;
}

const toSetRow = (
  { workout, strengthTest, t }: SetRowContext,
  entry: UserExerciseDataType,
  exercise: ExerciseType | undefined,
): CsvField[] => {
  const weightKg = toWeightKg(entry, exercise, strengthTest);
  return [
    workout.id,
    formatLocalDateTime(workout.timestamp),
    entry.exerciseId,
    exerciseName(entry, exercise),
    entry.skill,
    ...(entry.set ?? [null, null]),
    repetitionsOrNull(entry),
    weightKg,
    toWeightType(exercise, weightKg, t),
    fMaxPercentOrNull(entry),
    entry.duration ?? null,
    entry.height ?? null,
    toDifficulty(entry, t),
  ];
};

/** One row per performed set, oldest workout first. */
export const toExerciseSetRows = (
  workouts: CompleteWorkoutType[],
  testHistory: MaxValuesType[],
  t: TFunction,
  getExercise: (id: string) => ExerciseType | undefined = getExerciseById,
): CsvField[][] => {
  const tests = [...testHistory].sort((a, b) => a.testAt - b.testAt);
  return [...workouts]
    .sort((a, b) => a.timestamp - b.timestamp)
    .flatMap((workout) => {
      const strengthTest = tests.findLast(
        (test) => test.testAt <= workout.timestamp,
      );
      return performedSets(workout.exercises).map((entry) =>
        toSetRow(
          { workout, strengthTest, t },
          entry,
          getExercise(entry.exerciseId),
        ),
      );
    });
};

/** One row per strength test, oldest first. A missing barbell value is null. */
export const toStrengthTestRows = (history: MaxValuesType[]): CsvField[][] =>
  [...history]
    .sort((a, b) => a.testAt - b.testAt)
    .map((test) => [
      formatLocalDateTime(test.testAt),
      roundOrNull(test.kneeDominant.barbell),
      roundOrNull(test.hipHinge.barbell),
      roundOrNull(test.horizontalPush.barbell),
      roundOrNull(test.horizontalPull.barbell),
      roundOrNull(test.verticalPush.barbell),
    ]);

export const buildExportFileName = (
  kind: ExportKind,
  scale: ScaleType,
  today: Date,
): string => `${kind}_${scale}_${formatDateToISO(today)}.csv`;

import type { CsvField } from "@/features/statistics/models/csv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { dateToHHMM, formatDateToISO } from "@/utils/date";

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

/** One row per completed workout, oldest first. */
export const toWorkoutRows = (workouts: CompleteWorkoutType[]): CsvField[][] =>
  [...workouts]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((workout) => [
      formatLocalDateTime(workout.timestamp),
      Math.round((workout.duration / 60) * 10) / 10,
      workout.exerciseCount ?? 0,
      workout.xpEarned ?? 0,
      round2(workout.movedWeight ?? 0),
    ]);

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

import { buildCsv, type CsvField } from "@/utils/csv";
import {
  filterStrengthTestsByRange,
  filterWorkoutsByRange,
} from "@/features/statistics/models/rangeFilter";
import {
  buildExportFileName,
  toExerciseSetRows,
  toStrengthTestRows,
  type ExportKind,
} from "@/features/statistics/models/statisticsCsv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { useCsvShare } from "@/hooks/useCsvShare";
import { useAuthStore } from "@/store/authStore";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useStatisticsWorkouts } from "./useStatisticsWorkouts";

interface UseStatisticsExportParams {
  kind: ExportKind;
  scale: ScaleType;
}

interface ExportTable {
  header: string[];
  rows: CsvField[][];
}

interface ExportSource extends UseStatisticsExportParams {
  workouts: CompleteWorkoutType[];
  testHistory: MaxValuesType[];
}

const buildExportTable = (
  { kind, scale, workouts, testHistory }: ExportSource,
  t: TFunction,
): ExportTable => {
  if (kind === "workouts") {
    return {
      header: [
        t("statistics.export.headers.workoutId"),
        t("statistics.export.headers.date"),
        t("statistics.export.headers.exerciseId"),
        t("statistics.export.headers.exercise"),
        t("statistics.export.headers.skill"),
        t("statistics.export.headers.set"),
        t("statistics.export.headers.setCount"),
        t("statistics.export.headers.repetitions"),
        t("statistics.export.headers.weightKg"),
        t("statistics.export.headers.weightType"),
        t("statistics.export.headers.weightPercentFMax"),
        t("statistics.export.headers.durationSeconds"),
        t("statistics.export.headers.heightCm"),
        t("statistics.export.headers.difficulty"),
      ],
      rows: toExerciseSetRows(
        filterWorkoutsByRange(workouts, scale),
        testHistory,
        t,
      ),
    };
  }
  return {
    header: [
      t("statistics.export.headers.date"),
      t("statistics.export.headers.squat"),
      t("statistics.export.headers.deadlift"),
      t("statistics.export.headers.benchPress"),
      t("statistics.export.headers.rowing"),
      t("statistics.export.headers.shoulderPress"),
    ],
    rows: toStrengthTestRows(filterStrengthTestsByRange(testHistory, scale)),
  };
};

/**
 * Exports the current user's workouts or strength tests of the selected
 * range as CSV. Refuses without a logged-in user.
 */
export const useStatisticsExport = ({
  kind,
  scale,
}: UseStatisticsExportParams) => {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.auth?.userId ?? null);
  const workouts = useStatisticsWorkouts();
  const testHistory = useExerciseProgressStore((state) => state.testHistory);
  const { share, isSharing } = useCsvShare();

  const table = buildExportTable(
    { kind, scale, workouts, testHistory: testHistory ?? [] },
    t,
  );

  const hasData = userId !== null && table.rows.length > 0;

  const exportCsv = async () => {
    if (!hasData) return;

    await share(
      buildExportFileName(kind, scale, new Date()),
      buildCsv(table.header, table.rows),
    );
  };

  return { canExport: hasData && !isSharing, exportCsv };
};

import { Alert } from "@/common/Alert";
import { buildCsv, type CsvField } from "@/features/statistics/models/csv";
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
import { shareCsv } from "@/features/statistics/services/shareCsv";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import type { TFunction } from "i18next";
import { useRef, useState } from "react";
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

/** Alerts the user instead of throwing when sharing fails. */
const shareExportTable = async (
  { header, rows }: ExportTable,
  kind: ExportKind,
  scale: ScaleType,
  t: TFunction,
): Promise<void> => {
  try {
    await shareCsv(
      buildExportFileName(kind, scale, new Date()),
      buildCsv(header, rows),
    );
  } catch (error) {
    Logger.logError(
      error instanceof Error ? error : new Error("CSV export failed"),
    );
    Alert.alert(t("common.error"));
  }
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
  const [isExporting, setIsExporting] = useState(false);
  const inFlight = useRef(false);

  const table = buildExportTable(
    { kind, scale, workouts, testHistory: testHistory ?? [] },
    t,
  );

  const canExport = userId !== null && table.rows.length > 0 && !isExporting;

  const exportCsv = async () => {
    if (inFlight.current || userId === null || table.rows.length === 0) {
      return;
    }
    inFlight.current = true;
    setIsExporting(true);
    await shareExportTable(table, kind, scale, t).finally(() => {
      inFlight.current = false;
      setIsExporting(false);
    });
  };

  return { canExport, exportCsv, isExporting };
};

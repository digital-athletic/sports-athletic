import { Alert } from "@/common/Alert";
import { buildCsv, type CsvField } from "@/features/statistics/models/csv";
import {
  filterStrengthTestsByRange,
  filterWorkoutsByRange,
} from "@/features/statistics/models/rangeFilter";
import {
  buildExportFileName,
  toStrengthTestRows,
  toWorkoutRows,
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
import { useCallback, useMemo, useRef, useState } from "react";
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

const buildExportTable = (
  kind: ExportKind,
  scale: ScaleType,
  workouts: CompleteWorkoutType[],
  testHistory: MaxValuesType[],
  t: TFunction,
): ExportTable => {
  if (kind === "workouts") {
    return {
      header: [
        t("statistics.export.headers.date"),
        t("statistics.export.headers.durationMinutes"),
        t("statistics.export.headers.exerciseCount"),
        t("statistics.export.headers.xp"),
        t("statistics.export.headers.movedWeightKg"),
      ],
      rows: toWorkoutRows(filterWorkoutsByRange(workouts, scale)),
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
  const [isExporting, setIsExporting] = useState(false);
  const inFlight = useRef(false);

  const { header, rows } = useMemo(
    () => buildExportTable(kind, scale, workouts, testHistory ?? [], t),
    [kind, scale, workouts, testHistory, t],
  );

  const canExport = userId !== null && rows.length > 0 && !isExporting;

  const exportCsv = useCallback(async () => {
    if (inFlight.current || userId === null || rows.length === 0) {
      return;
    }
    inFlight.current = true;
    setIsExporting(true);
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
    } finally {
      inFlight.current = false;
      setIsExporting(false);
    }
  }, [userId, rows, header, kind, scale, t]);

  return { canExport, exportCsv, isExporting };
};

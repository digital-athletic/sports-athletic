import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useCallback, useMemo, useState } from "react";
import {
  PowerTestChartData,
  processTestHistory,
  sortTestHistoryByDate,
} from "../models/ChartData";
import { filterStrengthTestsByRange } from "../models/rangeFilter";
import type { ScaleType } from "../models/WorkoutsData";

interface UsePowerTestDataOptions {
  expandFirstEntry?: boolean;
  /** Undefined skips range filtering. */
  scale?: ScaleType;
}

/**
 * Custom hook for PowerTest data and logic
 */
export const usePowerTestData = (options: UsePowerTestDataOptions = {}) => {
  const { expandFirstEntry = false, scale } = options;
  const storedHistory = useExerciseProgressStore((state) => state.testHistory);
  const testHistory = useMemo(
    () =>
      scale && storedHistory
        ? filterStrengthTestsByRange(storedHistory, scale)
        : storedHistory,
    [storedHistory, scale],
  );

  const anamnesisCompleted = useUserProfileStore(
    (state) => state.anamnesisCompleted,
  );

  // Initialize with first entry expanded if on success screen
  const [expandedEntries, setExpandedEntries] = useState<boolean[]>(
    () => testHistory?.map((_, index) => index === 0 && expandFirstEntry) ?? [],
  );

  const chartData: PowerTestChartData = useMemo(
    () => processTestHistory(testHistory),
    [testHistory],
  );

  const sortedHistory = useMemo(
    () => sortTestHistoryByDate(testHistory),
    [testHistory],
  );

  const hasHistory = testHistory && testHistory.length > 0;
  const hasChartData = chartData.dates.length > 0;

  const toggleHistoryEntry = useCallback((index: number) => {
    setExpandedEntries((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  }, []);

  const isEntryExpanded = useCallback(
    (index: number) => expandedEntries[index] ?? false,
    [expandedEntries],
  );

  return {
    testHistory,
    sortedHistory,
    chartData,
    hasHistory,
    hasChartData,
    anamnesisCompleted,
    toggleHistoryEntry,
    isEntryExpanded,
  };
};

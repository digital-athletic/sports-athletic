import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useCallback, useMemo, useState } from "react";
import {
  PowerTestChartData,
  processTestHistory,
  sortTestHistoryByDate,
} from "../models/ChartData";

interface UsePowerTestDataOptions {
  expandFirstEntry?: boolean;
}

/**
 * Custom hook for PowerTest data and logic
 */
export const usePowerTestData = (options: UsePowerTestDataOptions = {}) => {
  const { expandFirstEntry = false } = options;
  const testHistory = useExerciseProgressStore((state) => state.testHistory);

  const anamnesisCompleted = useUserProfileStore(
    (state) => state.anamnesisCompleted,
  );

  // Initialize with first entry expanded if on success screen
  const [expandedEntries, setExpandedEntries] = useState<boolean[]>(() => {
    const entries =
      testHistory?.map((_, index) =>
        index === 0 && expandFirstEntry ? true : false,
      ) ?? [];
    return entries;
  });

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
      if (typeof updated[index] !== "undefined") {
        updated[index] = !updated[index];
      }
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

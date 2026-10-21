import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useState } from "react";
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
  const testHistory =
    scale && storedHistory
      ? filterStrengthTestsByRange(storedHistory, scale)
      : storedHistory;

  const anamnesisCompleted = useUserProfileStore(
    (state) => state.anamnesisCompleted,
  );

  // Initialize with first entry expanded if on success screen
  const [expandedEntries, setExpandedEntries] = useState<boolean[]>(
    () => testHistory?.map((_, index) => index === 0 && expandFirstEntry) ?? [],
  );

  const chartData: PowerTestChartData = processTestHistory(testHistory);

  const sortedHistory = sortTestHistoryByDate(testHistory);

  const hasHistory = testHistory && testHistory.length > 0;
  const hasChartData = chartData.dates.length > 0;

  const toggleHistoryEntry = (index: number) => {
    setExpandedEntries((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const isEntryExpanded = (index: number) => expandedEntries[index] ?? false;

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

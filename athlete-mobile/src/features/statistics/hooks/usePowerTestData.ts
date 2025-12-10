import { MaxValuesType } from "@/features/training/models/MaxValues";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useCallback, useMemo, useState } from "react";
import {
  PowerTestChartData,
  processTestHistory,
  sortTestHistoryByDate,
} from "../models/ChartData";

const DUMMY_TEST_HISTORY: MaxValuesType[] = [
  {
    hip: { oneSidedBarbell: 100 },
    knee: { barbell: 90 },
    unterkoerper: { barbell: 95 },
    verticalPush: { barbell: 80 },
    verticalPull: { barbell: 85 },
    horizontalPush: { barbell: 70 },
    horizontalPull: { barbell: 75 },
    testDate: "01-01-2023",
  },
  {
    hip: { barbell: 110 },
    knee: { barbell: 100 },
    unterkoerper: { barbell: 105 },
    verticalPush: { barbell: 90 },
    verticalPull: { barbell: 95 },
    horizontalPush: { barbell: 80 },
    horizontalPull: { barbell: 85 },
    testDate: "01-03-2023",
  },
  {
    hip: { barbell: 120 },
    knee: { barbell: 110 },
    unterkoerper: { barbell: 115 },
    verticalPush: { barbell: 100 },
    verticalPull: { barbell: 105 },
    horizontalPush: { barbell: 90 },
    horizontalPull: { barbell: 95 },
    testDate: "01-05-2023",
  },
];

/**
 * Custom hook for PowerTest data and logic
 */
export const usePowerTestData = () => {
  // const testHistory = useExerciseProgressStore((state) => {
  //   return state.testHistory;
  // });
  const testHistory = DUMMY_TEST_HISTORY;

  const anamnesisCompleted = useUserProfileStore(
    (state) => state.anamnesisCompleted,
  );

  const [expandedEntries, setExpandedEntries] = useState<boolean[]>(
    () => testHistory?.map(() => false) ?? [],
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

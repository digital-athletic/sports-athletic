import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useState } from "react";

/**
 * Tracks which checklist row's exercise-timer bottom sheet is open. Only one
 * sheet can be open at a time, so a single nullable index is enough.
 */
export function useTrainingListSheet(rows: ListRow[]) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeRow = rows.find((row) => row.index === activeIndex) ?? null;

  const openSheet = (index: number) => setActiveIndex(index);
  const closeSheet = () => setActiveIndex(null);

  return { activeRow, openSheet, closeSheet };
}

import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useState } from "react";

type SheetState = { index: number; session: number; isOpen: boolean };

/**
 * Tracks which checklist row's exercise sheet is open. The last opened row
 * stays available as shownRow while the sheet animates closed, and session
 * counts the opens so each one can start fresh.
 */
export function useTrainingListSheet(rows: ListRow[]) {
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const shownRow = sheet
    ? (rows.find((row) => row.index === sheet.index) ?? null)
    : null;
  const activeRow = sheet?.isOpen ? shownRow : null;

  // A second Next tap from the same render asks for the set already open;
  // keeping its session keeps its timer running.
  const openSheet = (index: number) =>
    setSheet((prev) =>
      prev?.isOpen && prev.index === index
        ? prev
        : { index, session: (prev?.session ?? 0) + 1, isOpen: true },
    );
  const closeSheet = () =>
    setSheet((prev) => (prev ? { ...prev, isOpen: false } : prev));

  return {
    activeRow,
    shownRow,
    session: sheet?.session ?? 0,
    openSheet,
    closeSheet,
  };
}

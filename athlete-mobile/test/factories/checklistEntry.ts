import { type ChecklistEntry } from "@/features/training/hooks/useTrainingListRows";

/**
 * Builds a pending checklist entry with one open set at list index 0 for
 * exercise "1". The overrides replace any field.
 *
 * generateChecklistEntry({ key: 2, firstOpenSetIndex: 2 })
 * → { key: 2, exerciseId: "1", displayName: "Test Exercise", isTest: false,
 *     sets: [{ index: 0, label: undefined, completed: false }],
 *     completed: false, firstOpenSetIndex: 2 }
 */
export const generateChecklistEntry = (
  overrides: Partial<ChecklistEntry> = {},
): ChecklistEntry => ({
  key: 0,
  exerciseId: "1",
  displayName: "Test Exercise",
  isTest: false,
  sets: [{ index: 0, label: undefined, completed: false }],
  completed: false,
  firstOpenSetIndex: 0,
  ...overrides,
});

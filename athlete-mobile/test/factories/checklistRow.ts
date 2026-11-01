import { type ListRow } from "@/features/training/hooks/useTrainingListRows";

/**
 * Builds a pending checklist row at index 0 for exercise "1". The overrides
 * replace any field.
 *
 * generateChecklistRow({ isTest: true })
 * → { index: 0, exerciseId: "1", displayName: "Test Exercise", isTest: true,
 *     isLastInSet: true, isFeedbackSkill: false, completed: false }
 */
export const generateChecklistRow = (
  overrides: Partial<ListRow> = {},
): ListRow => ({
  index: 0,
  exerciseId: "1",
  displayName: "Test Exercise",
  isTest: false,
  isLastInSet: true,
  isFeedbackSkill: false,
  completed: false,
  ...overrides,
});

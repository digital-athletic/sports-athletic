import type { StoredTrainingDay } from "@/features/training/workoutGenerator/storedDayTemplate";
import { generateStoredDayEntry } from "./storedBranch";

/**
 * Builds a stored training day: one entry per branch ID under its skill, in
 * the key order of the argument, and the minutes per skill as `lengths`. Every
 * entry trains the exercise at level 2 and holds no tags.
 *
 * generateStoredTrainingDay({ WU: ["431"], CD: ["498"] }, { WU: 5, CD: 5 })
 * → { skills: { WU: [{ branchId: "431", tags: [], exercises: { "2": { exerciseId: "10" } } }],
 *               CD: [{ branchId: "498", ... }] },
 *     lengths: { WU: 5, CD: 5 } }
 */
export const generateStoredTrainingDay = (
  branchIdsBySkill: Record<string, string[]> = { GKS: ["510"] },
  minutesBySkill: Record<string, number> = {},
  exerciseId = "10",
): StoredTrainingDay => ({
  skills: Object.fromEntries(
    Object.entries(branchIdsBySkill).map(([skill, branchIds]) => [
      skill,
      branchIds.map((branchId) =>
        generateStoredDayEntry(branchId, [], exerciseId),
      ),
    ]),
  ),
  lengths: minutesBySkill,
});

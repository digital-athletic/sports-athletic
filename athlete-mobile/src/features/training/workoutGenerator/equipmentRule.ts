import { TagGroups } from "@/constants/tagGroups";
import { getTagValues } from "@/utils/tagUtils";
import { isEquipmentPartAvailable } from "./equipmentAvailability";
import type { GenerationInput } from "./generationInput";
import {
  type BranchRemoval,
  type CandidateBranch,
  type CandidateLevels,
  readReplacementRegion,
  type RuleFamilyResult,
} from "./ruleFamily";

const listBranchExerciseIds = (levels: CandidateLevels): string[] => [
  ...new Set(
    Object.values(levels)
      .map(({ exerciseId }) => exerciseId)
      .filter((exerciseId) => typeof exerciseId === "string"),
  ),
];

const listMissingBranchEquipment = (
  tags: string[],
  levels: CandidateLevels,
  equipment: string[],
): string[] => {
  const branchParts = getTagValues(tags, TagGroups.EQUIPMENT);
  const exerciseIds = listBranchExerciseIds(levels);
  return branchParts.filter(
    (part) =>
      !isEquipmentPartAvailable({ part, equipment, branchParts, exerciseIds }),
  );
};

/**
 * Removes the branches that need equipment the place lacks, with one region
 * request each, and the branches without levels, with no request. A branch
 * without levels gets empty removal details: it names no equipment, so
 * listMissingEquipment adds nothing for it.
 */
export const filterBranchesByEquipment = <T extends CandidateBranch>(
  branches: Record<string, T>,
  { equipment }: GenerationInput,
): RuleFamilyResult<T> => {
  const keep: Record<string, T> = {};
  const removals: BranchRemoval[] = [];
  const replace: string[] = [];
  for (const [branchId, branch] of Object.entries(branches)) {
    const levels = branch.levels || branch.exercises;
    const missing = levels
      ? listMissingBranchEquipment(branch.tags ?? [], levels, equipment)
      : [];
    if (levels && missing.length === 0) {
      keep[branchId] = branch;
    } else {
      removals.push({ branchId, family: "equipment", details: missing });
      replace.push(...(levels ? readReplacementRegion(branch.tags) : []));
    }
  }
  return { keep, removals, replace };
};

/**
 * Lists the equipment the equipment removals miss, once each in removal order:
 * the params of main's NO_EXERCISES/EQUIPMENT error for an unfilled skill.
 */
export const listMissingEquipment = (removals: BranchRemoval[]): string[] => [
  ...new Set(
    removals
      .filter((removal) => removal.family === "equipment")
      .flatMap((removal) => removal.details),
  ),
];

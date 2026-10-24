import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { getUserTagValues } from "@/utils/tagUtils";
import { resolveBranchExercise } from "./branchResolution";
import type { GenerationInput } from "./generationInput";
import {
  type BranchRemoval,
  type CandidateBranch,
  readReplacementRegion,
  type RuleFamilyResult,
} from "./ruleFamily";

/**
 * Removes the branches without an exercise at the athlete's fitness level or
 * branch level, with one region request each. Keeps every branch for an
 * athlete without workout data.
 */
export const filterBranchesByFitnessLevel = <T extends CandidateBranch>(
  branches: Record<string, T>,
  { athlete, exerciseCatalog, exerciseData }: GenerationInput,
): RuleFamilyResult<T> => {
  if (!athlete.workoutData) {
    return { keep: branches, removals: [], replace: [] };
  }
  const fitnessLevel =
    getUserTagValues(athlete.workoutData.tags, TagGroups.LEVEL)[0] ||
    WorkoutConstants.LEVELS.BEGINNER;
  const keep: Record<string, T> = {};
  const removals: BranchRemoval[] = [];
  const replace: string[] = [];
  for (const [branchId, branch] of Object.entries(branches)) {
    // main never hands this filter a branch without levels: equipment runs first
    const levels = branch.exercises ?? branch.levels ?? {};
    const exercise = resolveBranchExercise(
      { levels },
      fitnessLevel,
      exerciseCatalog,
      exerciseData.branchData[branchId] ?? null,
    );
    if (exercise === null) {
      removals.push({
        branchId,
        family: "fitnessLevel",
        details: [fitnessLevel],
      });
      replace.push(...readReplacementRegion(branch.tags));
    } else {
      keep[branchId] = branch;
    }
  }
  return { keep, removals, replace };
};

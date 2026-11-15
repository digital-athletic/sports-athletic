import type { GeneratorError } from "@/features/training/models/GeneratorError";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import { filterBranchesByAgeGroup } from "../../ruleFamilies/ageGroupRule";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "../../ruleFamilies/equipmentRule";
import { filterBranchesByFitnessLevel } from "../../ruleFamilies/fitnessLevelRule";
import { filterBranchesByGender } from "../../ruleFamilies/genderRule";
import type { GenerationInput } from "../../generationInput/generationInput";
import { filterBranchesByMuscleSoreness } from "../../ruleFamilies/muscleSorenessRule";
import { filterBranchesByPain } from "../../ruleFamilies/painRule";
import {
  type BranchRemoval,
  type CandidateBranch,
  readReplacementRegion,
  type RuleFamily,
} from "../../ruleFamilies/ruleFamily";
import type { WorkoutFilters } from "../../workoutFilters";
import type { StoredBranch } from "./storedBranchLookup";

/**
 * A region request no region tag carries, so its replacement draws from the
 * least used region of the skill.
 */
export const ANY_REGION_REQUEST = "ANY_REGION";

// Plan creation stores no branch that pain, age group or gender rule out, but
// a workout template lists its branches unfiltered. Each removed branch asks
// for a replacement of its own region.
const createAthleteRuleFamily =
  (filters: WorkoutFilters): RuleFamily =>
  (branches, input) => {
    const pain = filters.pain
      ? filterBranchesByPain(branches, input.athlete)
      : { keep: branches, removals: [] };
    const ageGroup = filterBranchesByAgeGroup(
      pain.keep,
      ageGroupFor(getUserBirthday(input.athlete)),
    );
    const gender = filterBranchesByGender(ageGroup.keep, input.athlete);
    const removals = [
      ...pain.removals,
      ...ageGroup.removals,
      ...gender.removals,
    ];
    return {
      keep: gender.keep,
      removals,
      replace: removals.map(
        ({ branchId }) =>
          readReplacementRegion(branches[branchId].tags)[0] ??
          ANY_REGION_REQUEST,
      ),
    };
  };

const filterBranchesByPlaceEquipment: RuleFamily = (branches, input) =>
  filterBranchesByEquipment(branches, input.equipment);

const listBranchesRuleChain = (filters: WorkoutFilters): RuleFamily[] => [
  createAthleteRuleFamily(filters),
  ...(filters.soreness ? [filterBranchesByMuscleSoreness] : []),
  ...(filters.equipment ? [filterBranchesByPlaceEquipment] : []),
  filterBranchesByFitnessLevel,
];

export interface BranchesRuleChainResult {
  keep: Record<string, CandidateBranch>;
  removals: BranchRemoval[];
  /** The regions to refill, in family order. */
  replace: string[];
  /** The error for a skill the chain empties. */
  emptyReason: GeneratorError;
}

/**
 * Runs pain, age group, gender, muscle soreness, equipment and fitness level
 * on the stored branches of a branches block, without the families `filters`
 * switches off. The candidates form one record keyed by branch ID, so a
 * repeated ID counts once and numeric IDs sort ascending.
 */
export const applyBranchesRuleChain = (
  storedBranches: StoredBranch[],
  input: GenerationInput,
  skill: string,
  filters: WorkoutFilters,
): BranchesRuleChainResult => {
  let keep: Record<string, CandidateBranch> = Object.fromEntries(
    storedBranches.map(({ branchId, branch }) => [branchId, branch]),
  );
  const removals: BranchRemoval[] = [];
  const replace: string[] = [];
  for (const filterBranches of listBranchesRuleChain(filters)) {
    const result = filterBranches(keep, input, skill);
    keep = result.keep;
    removals.push(...result.removals);
    replace.push(...result.replace);
  }
  return {
    keep,
    removals,
    replace,
    emptyReason: {
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: listMissingEquipment(removals),
    },
  };
};

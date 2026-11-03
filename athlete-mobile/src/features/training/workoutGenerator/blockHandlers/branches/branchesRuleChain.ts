import type { GeneratorError } from "@/features/training/models/GeneratorError";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "../../ruleFamilies/equipmentRule";
import { filterBranchesByFitnessLevel } from "../../ruleFamilies/fitnessLevelRule";
import type { GenerationInput } from "../../generationInput/generationInput";
import { filterBranchesByMuscleSoreness } from "../../ruleFamilies/muscleSorenessRule";
import type {
  BranchRemoval,
  CandidateBranch,
  RuleFamily,
} from "../../ruleFamilies/ruleFamily";
import type { StoredBranch } from "./storedBranchLookup";

// A training day runs muscle soreness first, then equipment, then fitness level
const BRANCHES_RULE_CHAIN: readonly RuleFamily[] = [
  filterBranchesByMuscleSoreness,
  (branches, input) => filterBranchesByEquipment(branches, input.equipment),
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
 * Runs muscle soreness, equipment and fitness level on the stored branches of
 * a branches block. The candidates form one record keyed by branch ID, so a
 * repeated ID counts once and numeric IDs sort ascending.
 */
export const applyBranchesRuleChain = (
  storedBranches: StoredBranch[],
  input: GenerationInput,
  skill: string,
): BranchesRuleChainResult => {
  let keep: Record<string, CandidateBranch> = Object.fromEntries(
    storedBranches.map(({ branchId, branch }) => [branchId, branch]),
  );
  const removals: BranchRemoval[] = [];
  const replace: string[] = [];
  for (const filterBranches of BRANCHES_RULE_CHAIN) {
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

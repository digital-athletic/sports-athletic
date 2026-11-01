import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import { filterBranchesByAgeGroup } from "@/features/training/workoutGenerator/ruleFamilies/ageGroupRule";
import { filterBranchesByEquipment } from "@/features/training/workoutGenerator/ruleFamilies/equipmentRule";
import { filterBranchesByGender } from "@/features/training/workoutGenerator/ruleFamilies/genderRule";
import { filterBranchesByPainOnEveryLevel } from "@/features/training/workoutGenerator/ruleFamilies/painRule";
import {
  type BranchRemoval,
  type CandidateBranch,
  listBranchRemovals,
  type RuleFamilyResult,
} from "@/features/training/workoutGenerator/ruleFamilies/ruleFamily";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import type { DerivedProfile } from "../stages/profileDerivation";
import { filterBranchesByGoalkeeperExclusion } from "./goalkeeperRule";

/** The training day a skill fills: its training place and the branches it already holds. */
export interface BranchRuleChainDay {
  readonly place: TrainingDayType["place"];
  readonly usedBranchIds: readonly string[];
}

/** The candidates the chain keeps, and every removal in chain order. */
export interface BranchRuleChainResult<T extends CandidateBranch> {
  readonly keep: Record<string, T>;
  readonly removals: readonly BranchRemoval[];
}

type ChainStep = <T extends CandidateBranch>(
  branches: Record<string, T>,
) => RuleFamilyResult<T>;

const filterUsedBranches =
  (usedBranchIds: readonly string[]): ChainStep =>
  (branches) => {
    const keep = Object.fromEntries(
      Object.entries(branches).filter(
        ([branchId]) => !usedBranchIds.includes(branchId),
      ),
    );
    return {
      keep,
      removals: listBranchRemovals(branches, keep, "usedBranch", () => []),
      replace: [],
    };
  };

/**
 * Filters the candidate branches of one skill as spec section 5, rule 2
 * defines, in this order: used branches of the day, age group, gender,
 * equipment of the day's training place, pain, goalkeeper exclusion. Each
 * family sees only the branches the families before it kept. The pain family
 * reads the exercise of every level, so a level change never reaches a
 * blocked exercise.
 *
 * applyBranchRuleChain({ "1": <AGE_CHILD>, "2": <untagged> }, { place: "HOME", usedBranchIds: [] }, adult, input)
 * → { keep: { "2": ... }, removals: [{ branchId: "1", family: "ageGroup", details: ["ADULT"] }] }
 */
export const applyBranchRuleChain = <T extends CandidateBranch>(
  candidates: Record<string, T>,
  day: BranchRuleChainDay,
  profile: DerivedProfile,
  input: PlanGenerationInput,
): BranchRuleChainResult<T> => {
  const { athlete, authoredData, trainingPlaces } = input;
  const chain: readonly ChainStep[] = [
    filterUsedBranches(day.usedBranchIds),
    (branches) => filterBranchesByAgeGroup(branches, profile.ageGroup),
    (branches) => filterBranchesByGender(branches, athlete),
    (branches) =>
      filterBranchesByEquipment(
        branches,
        trainingPlaces[day.place]?.equipment ?? [],
      ),
    (branches) =>
      filterBranchesByPainOnEveryLevel(
        branches,
        athlete,
        authoredData.exerciseCatalog,
      ),
    (branches) =>
      filterBranchesByGoalkeeperExclusion(
        branches,
        profile.playingPositionGroup,
        authoredData.exerciseCatalog,
      ),
  ];
  return chain.reduce<BranchRuleChainResult<T>>(
    ({ keep, removals }, filterBranches) => {
      const result = filterBranches(keep);
      return {
        keep: result.keep,
        removals: [...removals, ...result.removals],
      };
    },
    { keep: candidates, removals: [] },
  );
};

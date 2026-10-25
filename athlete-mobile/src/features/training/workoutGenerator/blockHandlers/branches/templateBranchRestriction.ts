import type { GenerationInput } from "../../generationInput/generationInput";
import { filterBranchesByAgeGroup } from "../../ruleFamilies/ageGroupRule";
import { filterBranchesByGender } from "../../ruleFamilies/genderRule";
import { filterBranchesByPain } from "../../ruleFamilies/painRule";
import {
  type CandidateBranch,
  throwWhenPoolEmpty,
} from "../../ruleFamilies/ruleFamily";
import type { BranchesBlock } from "../../stages/blockWalk";
import { lookUpStoredBranchInCatalog } from "./storedBranchLookup";

/**
 * Drops the listed branches of an authored branches block that the athlete's
 * pains, age group or gender rule out, as plan creation does before it stores
 * a branch. A rule that removes every listed branch throws its NO_EXERCISES
 * error, as the picks workout rules do. Branches the catalog lacks stay for
 * the handler.
 *
 * restrictTemplateBranchesBlock({ skill: "GKS", branches: ["510", "523"], ... }, kneePainInput)
 * → { skill: "GKS", branches: ["510"], ... }
 */
export const restrictTemplateBranchesBlock = (
  block: BranchesBlock,
  input: GenerationInput,
): BranchesBlock => {
  const listed: Record<string, CandidateBranch> = {};
  for (const branchId of block.branches) {
    const branch = lookUpStoredBranchInCatalog(block.skill, branchId, input);
    if (branch) listed[branchId] = branch;
  }
  if (Object.keys(listed).length === 0) return block;
  const painResult = filterBranchesByPain(listed, input);
  throwWhenPoolEmpty(
    painResult.keep,
    "PAIN",
    painResult.removals.flatMap((removal) => removal.details),
  );
  const ageGroupKeep = filterBranchesByAgeGroup(painResult.keep, input).keep;
  throwWhenPoolEmpty(ageGroupKeep, "AGE", []);
  const genderKeep = filterBranchesByGender(ageGroupKeep, input).keep;
  throwWhenPoolEmpty(genderKeep, "GENDER", []);
  const [first, ...rest] = block.branches.filter(
    (branchId) =>
      Object.hasOwn(genderKeep, branchId) || !Object.hasOwn(listed, branchId),
  );
  return first === undefined ? block : { ...block, branches: [first, ...rest] };
};

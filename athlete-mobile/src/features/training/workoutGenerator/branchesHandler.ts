import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { getTagValues } from "@/utils/tagUtils";
import type { BlockHandlerRegistry, BlockResult } from "./blockWalk";
import {
  isPreventionOrSpecialWarmUpSkill,
  replaceBlockedBranches,
} from "./branchReplacement";
import { resolveBranchExercise } from "./branchResolution";
import {
  applyBranchesRuleChain,
  type BranchesRuleChainResult,
} from "./branchesRuleChain";
import type { CandidateBranch } from "./ruleFamily";
import { readSkillCatalogEntry } from "./skillCatalogEntry";
import {
  listStoredBranches,
  type StoredBranch,
  type StoredBranchLookup,
} from "./storedBranchLookup";
import type { WorkoutInput } from "./workoutSetup";

/**
 * Resolves each branch to its exercise at the athlete level or the athlete's
 * branch level. A branch without an exercise keeps its slot with exercise ID
 * "-1", which the set list builder drops.
 */
const resolveBranchExercises = (
  branches: StoredBranch[],
  input: WorkoutInput,
): BranchExerciseReference[] =>
  branches.map(({ branchId, branch }) => {
    const tags = branch.tags ?? [];
    // A stored day entry names its exercises under `exercises`, a catalog
    // branch under `levels`; the catalog lookup needs the second.
    const exercise = resolveBranchExercise(
      { levels: branch.exercises ?? branch.levels ?? {}, tags },
      input.athleteLevel,
      input.exerciseCatalog,
      input.exerciseData.branchData[branchId] ?? null,
    );
    return {
      branchId,
      branchTags: exercise ? exercise.tags : tags,
      exerciseId: exercise?.id ?? "-1",
    };
  });

/** Whether the branch trains a pain region of the prevention skill. */
const isInOwnPreventionRegion = (
  skill: string,
  branch: CandidateBranch,
  input: WorkoutInput,
): boolean => {
  const preventionRegions =
    readSkillCatalogEntry(input.skillCatalog, skill)?.painRegions ?? [];
  return getTagValues(branch.tags ?? [], TagGroups.PREVENTION).some((region) =>
    preventionRegions.includes(region),
  );
};

// A prevention skill refills only from its own region, all slots or none
const keepOwnPreventionRegionReplacement = (
  skill: string,
  slotCount: number,
  replacement: StoredBranch[],
  input: WorkoutInput,
): StoredBranch[] => {
  if (skill.indexOf("PREV") === -1) return replacement;
  const fromOwnRegion = replacement.every(({ branch }) =>
    isInOwnPreventionRegion(skill, branch, input),
  );
  return fromOwnRegion && replacement.length >= slotCount ? replacement : [];
};

// A prevention or special warm-up skill requests a slot for each kept branch
// too and puts that branch back into the pool. Any other skill keeps its kept
// branches and adds the replacement after them.
const refillRequestedRegions = (
  skill: string,
  keptBranches: StoredBranch[],
  regions: string[],
  input: WorkoutInput,
): StoredBranch[] => {
  const refillsEverySlot = isPreventionOrSpecialWarmUpSkill(skill);
  const keep = refillsEverySlot ? [] : keptBranches;
  const replace = refillsEverySlot
    ? [...regions, ...keptBranches.map(() => regions[0])]
    : regions;
  const replacement = replaceBlockedBranches(
    { skill, replace, usedBranchIds: keep.map(({ branchId }) => branchId) },
    input,
  );
  return [
    ...keep,
    ...keepOwnPreventionRegionReplacement(
      skill,
      replace.length,
      replacement,
      input,
    ),
  ];
};

// Picks the branches a block trains, one case per rule
const chooseBlockBranches = (
  skill: string,
  storedBranches: StoredBranch[],
  chain: BranchesRuleChainResult,
  input: WorkoutInput,
): StoredBranch[] => {
  const keptBranches = Object.entries(chain.keep).map(([branchId, branch]) => ({
    branchId,
    branch,
  }));
  // Without a region request the block keeps every stored branch, repeats and
  // removed branches included; the rule chain only decides whether a region
  // needs refilling.
  if (chain.replace.length === 0) {
    return keptBranches.length > 0 ? storedBranches : [];
  }
  // a cardio skill keeps its kept branches
  if (skill.indexOf("CARDIO") !== -1) return keptBranches;
  return refillRequestedRegions(skill, keptBranches, chain.replace, input);
};

/**
 * Builds the branches handler of a training day. The lookup reads the stored
 * branch IDs: the branch lookup index, or the entries a stored training day
 * saved at plan creation. No default, so a caller always picks one.
 */
export const createBranchesBlockHandler = (
  lookUpStoredBranch: StoredBranchLookup,
): BlockHandlerRegistry["branches"] => ({
  usedBranchScope: "block",
  handleBlock: (block, input): BlockResult => {
    const storedBranches = listStoredBranches(block, input, lookUpStoredBranch);
    const chain = applyBranchesRuleChain(storedBranches, input, block.skill);
    const exercises = resolveBranchExercises(
      chooseBlockBranches(block.skill, storedBranches, chain, input),
      input,
    );
    return exercises.length > 0
      ? {
          status: "filled",
          block,
          exercises,
          usedBranchIds: [
            ...new Set(exercises.map(({ branchId }) => branchId)),
          ],
        }
      : {
          status: "empty",
          block,
          // a prevention or special warm-up skill that its replacement
          // emptied records no reason
          reason:
            isPreventionOrSpecialWarmUpSkill(block.skill) &&
            chain.replace.length > 0
              ? undefined
              : chain.emptyReason,
          usedBranchIds: [],
        };
  },
});

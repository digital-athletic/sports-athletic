import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { getTagValues } from "@/utils/tagUtils";
import type {
  BlockHandlerRegistry,
  BlockResult,
  BranchesBlock,
} from "../../stages/blockWalk";
import {
  isPreventionOrSpecialWarmUpSkill,
  replaceBlockedBranches,
} from "../library/branchReplacement";
import { resolveStoredBranchExercise } from "../library/branchResolution";
import {
  ANY_REGION_REQUEST,
  applyBranchesRuleChain,
  type BranchesRuleChainResult,
} from "./branchesRuleChain";
import { replaceCardioBlock } from "./cardioReplacement";
import { refillBranchSlots, splitDuplicateBranches } from "./duplicateBranches";
import type { CandidateBranch } from "../../ruleFamilies/ruleFamily";
import { readSkillCatalogEntry } from "../../generationInput/skillCatalogEntry";
import {
  listStoredBranches,
  type StoredBranch,
  type StoredBranchLookup,
} from "./storedBranchLookup";
import type { WorkoutInput } from "../../stages/workoutSetup";

/**
 * Resolves each branch to its exercise at the athlete level or the athlete's
 * branch level. A branch without an exercise keeps its slot with exercise ID
 * "-1", which the set list builder drops.
 */
const resolveBranchExercises = (
  branches: StoredBranch[],
  input: WorkoutInput,
): BranchExerciseReference[] =>
  branches.map((storedBranch) =>
    resolveStoredBranchExercise(
      storedBranch,
      input.athleteLevel,
      input.exerciseCatalog,
      input.exerciseData.branchData[storedBranch.branchId] ?? null,
    ),
  );

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
// branches and adds the replacement after them. On replay, the "blockedSlots"
// refill leaves the kept branches in place and refills each blocked slot on
// its own.
const refillRequestedRegions = (
  skill: string,
  keptBranches: StoredBranch[],
  regions: string[],
  input: WorkoutInput,
): StoredBranch[] => {
  if (input.branchRefill === "blockedSlots") {
    return [
      ...keptBranches,
      ...refillDuplicateSlots(skill, keptBranches, regions, input),
    ];
  }
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

// Refills each duplicate slot on its own: a slot without a fitting branch
// drops out and the others stay. A replay runs this path for every skill.
const refillDuplicateSlots = (
  skill: string,
  keptBranches: StoredBranch[],
  regions: string[],
  input: WorkoutInput,
): StoredBranch[] =>
  refillBranchSlots(regions, keptBranches, (usedBranchIds, region) => {
    const replacement = replaceBlockedBranches(
      { skill, replace: [region], usedBranchIds },
      input,
    );
    return keepOwnPreventionRegionReplacement(skill, 1, replacement, input)[0];
  });

interface DuplicateStep {
  keptBranches: StoredBranch[];
  replace: string[];
  /** Set for a skill that refills every slot and found duplicates: the final refill. */
  refilled?: StoredBranch[];
}

// A kept branch whose exercise an earlier kept branch holds counts as blocked,
// except for a cardio skill and for a prevention or special warm-up skill that
// already refills every slot. Another skill adds the duplicate regions to its
// region requests; a skill that refills every slot refills only those slots.
const splitDuplicateBranchesIntoReplace = (
  skill: string,
  chainBranches: StoredBranch[],
  chainReplace: string[],
  input: WorkoutInput,
): DuplicateStep => {
  const refillsEverySlot = isPreventionOrSpecialWarmUpSkill(skill);
  const unchanged = { keptBranches: chainBranches, replace: chainReplace };
  if (
    skill.indexOf("CARDIO") !== -1 ||
    (refillsEverySlot && chainReplace.length > 0)
  ) {
    return unchanged;
  }
  const split = splitDuplicateBranches(chainBranches, input);
  const keptBranches = split.unique;
  if (!refillsEverySlot) {
    return {
      keptBranches,
      replace: [...chainReplace, ...split.duplicateRegions],
    };
  }
  return {
    keptBranches,
    replace: chainReplace,
    refilled:
      split.duplicateRegions.length > 0
        ? refillDuplicateSlots(
            skill,
            keptBranches,
            split.duplicateRegions,
            input,
          )
        : undefined,
  };
};

// Picks the branches a block trains, one case per rule
const chooseBlockBranches = (
  skill: string,
  storedBranches: StoredBranch[],
  chain: BranchesRuleChainResult,
  input: WorkoutInput,
): StoredBranch[] => {
  const chainBranches = Object.entries(chain.keep).map(
    ([branchId, branch]) => ({
      branchId,
      branch,
    }),
  );
  const { keptBranches, replace, refilled } = splitDuplicateBranchesIntoReplace(
    skill,
    chainBranches,
    chain.replace,
    input,
  );
  if (refilled) return [...keptBranches, ...refilled];
  // Without a region request the block keeps every stored branch, repeats and
  // removed branches included; the rule chain only decides whether a region
  // needs refilling.
  if (replace.length === 0) {
    return chainBranches.length > 0 ? storedBranches : [];
  }
  return refillRequestedRegions(skill, keptBranches, replace, input);
};

// The last swapped block that took over the skill, in template order
const findEarlierCardioSwap = (
  skill: string,
  earlierResults: readonly BlockResult[],
): BranchesBlock | undefined => {
  const swap = earlierResults.findLast(
    (result) =>
      result.status === "filled" &&
      result.swappedFrom !== undefined &&
      result.block.skill === skill,
  );
  return swap?.block.kind === "branches" ? swap.block : undefined;
};

/** One region request per distinct branch ID of the block that the lookup lacks. */
const listMissingBranchRegions = (
  block: BranchesBlock,
  storedBranches: readonly StoredBranch[],
): string[] => {
  const foundBranchIds = new Set(
    storedBranches.map(({ branchId }) => branchId),
  );
  return [...new Set(block.branches)]
    .filter((branchId) => !foundBranchIds.has(branchId))
    .map(() => ANY_REGION_REQUEST);
};

/**
 * Runs the rule chain on the found branches. A branch ID the lookup lacks
 * requests a replacement of the same skill, like a branch that a rule blocks;
 * those region requests come before the ones of the families.
 */
const applyBlockRuleChain = (
  block: BranchesBlock,
  storedBranches: StoredBranch[],
  input: WorkoutInput,
): BranchesRuleChainResult => {
  const chain = applyBranchesRuleChain(
    storedBranches,
    input,
    block.skill,
    input.filters,
  );
  return {
    ...chain,
    replace: [
      ...listMissingBranchRegions(block, storedBranches),
      ...chain.replace,
    ],
  };
};

// Filled with the resolved exercises, else empty with the rule chain reason
const buildBlockResult = (
  block: BranchesBlock,
  exercises: BranchExerciseReference[],
  chain: BranchesRuleChainResult,
): BlockResult =>
  exercises.length > 0
    ? {
        status: "filled",
        block,
        exercises,
        usedBranchIds: [...new Set(exercises.map(({ branchId }) => branchId))],
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

/**
 * Builds the branches handler. The lookup reads the stored branch IDs: the
 * branch lookup index, or the entries a stored training day saved at plan
 * creation.
 */
export const createBranchesBlockHandler =
  (lookUpStoredBranch: StoredBranchLookup): BlockHandlerRegistry["branches"] =>
  (storedBlock, input, _usedBranches, walk): BlockResult => {
    // A block whose skill an earlier cardio swap took over reads the swapped
    // entry, which holds no tags and no levels, in place of its stored branches.
    const earlierSwap = findEarlierCardioSwap(
      storedBlock.skill,
      walk?.earlierResults ?? [],
    );
    const block = earlierSwap ?? storedBlock;
    const storedBranches = earlierSwap
      ? block.branches.map((branchId) => ({ branchId, branch: {} }))
      : listStoredBranches(block, input, lookUpStoredBranch);
    const chain = applyBlockRuleChain(block, storedBranches, input);
    // a cardio skill with a region request runs the CARDIO_5 branch instead
    if (block.skill.indexOf("CARDIO") !== -1 && chain.replace.length > 0) {
      return { ...replaceCardioBlock(block, input), swappedFrom: storedBlock };
    }
    // a replay draws a replacement only from the pool of the stored block
    const blockInput = {
      ...input,
      replacementPool: input.replacementPools?.get(storedBlock),
    };
    const exercises = resolveBranchExercises(
      chooseBlockBranches(block.skill, storedBranches, chain, blockInput),
      input,
    );
    const result = buildBlockResult(block, exercises, chain);
    return earlierSwap && result.status === "filled"
      ? { ...result, swappedFrom: storedBlock }
      : result;
  };

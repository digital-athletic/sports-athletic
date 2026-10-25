import { TagGroups } from "@/constants/tagGroups";
import { requireWorkoutData } from "@/features/training/utils/userDataUtils";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import { filterBranchesByAgeGroup } from "./ageGroupRule";
import { resolveBranchExerciseId } from "./branchResolution";
import { filterBranchesByEquipment } from "./equipmentRule";
import { filterBranchesByFitnessLevel } from "./fitnessLevelRule";
import { filterBranchesByGender } from "./genderRule";
import { filterBranchesByMuscleSoreness } from "./muscleSorenessRule";
import { filterBranchesByPainOnEveryLevel } from "./painRule";
import { selectReplacementSkillTree } from "./replacementSkillTree";
import type { RuleFamily } from "./ruleFamily";
import type { StoredBranch } from "./storedBranchLookup";
import type { WorkoutInput } from "./workoutSetup";

// Pain checks every level of the catalog branch, so a level change never
// reaches a blocked exercise
const REPLACEMENT_RULE_CHAIN: readonly RuleFamily[] = [
  filterBranchesByMuscleSoreness,
  filterBranchesByEquipment,
  filterBranchesByFitnessLevel,
  filterBranchesByAgeGroup,
  filterBranchesByGender,
  filterBranchesByPainOnEveryLevel,
];

export interface BranchReplacementRequest {
  skill: string;
  /** One region per slot to refill. */
  replace: readonly string[];
  /** The branches the block already holds. */
  usedBranchIds: readonly string[];
}

interface ReplacementPool {
  /** The tree the context selects; only its branches count as used. */
  skillTree: SkillTreeType;
  candidates: string[];
  usedExerciseIds: Set<string>;
  branchesByRegion: Record<string, number>;
  maxCountPerRegion: number;
  resolveExerciseId: (branchId: string) => string | null;
}

/** A skill that refills all its slots or none. */
export const isPreventionOrSpecialWarmUpSkill = (skill: string): boolean =>
  skill.indexOf("PREV") !== -1 || skill === "WUSPEZIAL";

const countUsedBranchesByRegion = (
  skillTree: SkillTreeType,
  usedBranchIds: readonly string[],
): Record<string, number> => {
  const branchesByRegion: Record<string, number> = {
    LOWER_BODY: 0,
    UPPER_BODY: 0,
    CORE: 0,
    FULL_BODY: 0,
  };
  for (const branchId of usedBranchIds) {
    if (!Object.hasOwn(skillTree, branchId)) continue;
    const { tags } = skillTree[branchId];
    // a used branch counts by its first side tag, a chosen branch by any
    const count = getTagValues(tags, TagGroups.SIDE)[0] === "ONE" ? 2 : 1;
    for (const region of getTagValues(tags, TagGroups.REGION)) {
      branchesByRegion[region] = (branchesByRegion[region] ?? 0) + count;
    }
  }
  return branchesByRegion;
};

const buildReplacementPool = (
  skillTree: SkillTreeType,
  { skill, usedBranchIds }: BranchReplacementRequest,
  input: WorkoutInput,
): ReplacementPool => {
  let filtered = skillTree;
  for (const filterBranches of REPLACEMENT_RULE_CHAIN) {
    filtered = filterBranches(filtered, input, skill).keep;
  }
  const resolveExerciseId = (branchId: string): string | null =>
    resolveBranchExerciseId(
      skillTree[branchId],
      input.athleteLevel,
      input.exerciseData.branchData[branchId],
    );
  return {
    skillTree,
    candidates: Object.keys(filtered).filter(
      (branchId) => !usedBranchIds.includes(branchId),
    ),
    usedExerciseIds: new Set(
      usedBranchIds.flatMap((branchId) =>
        Object.hasOwn(skillTree, branchId)
          ? (resolveExerciseId(branchId) ?? [])
          : [],
      ),
    ),
    branchesByRegion: countUsedBranchesByRegion(skillTree, usedBranchIds),
    maxCountPerRegion: input.athleteLevel === "PROFESSIONAL" ? 6 : 5,
    resolveExerciseId,
  };
};

const listRegionBranches = (pool: ReplacementPool, region: string): string[] =>
  pool.candidates.filter((branchId) =>
    getTagValues(pool.skillTree[branchId].tags, TagGroups.REGION).includes(
      region,
    ),
  );

const isOneSidedBranch = (pool: ReplacementPool, branchId: string): boolean =>
  getTagValues(pool.skillTree[branchId].tags, TagGroups.SIDE).includes("ONE");

const listLessUsedRegionBranches = (pool: ReplacementPool): string[] => {
  const { branchesByRegion, maxCountPerRegion } = pool;
  const lessUsedRegions = Object.keys(branchesByRegion).sort(
    (a, b) => branchesByRegion[a] - branchesByRegion[b],
  );
  for (const region of lessUsedRegions) {
    if (branchesByRegion[region] >= maxCountPerRegion) break;
    let regionBranches = listRegionBranches(pool, region);
    // a one sided branch takes two slots
    if (maxCountPerRegion - branchesByRegion[region] === 1) {
      regionBranches = regionBranches.filter(
        (branchId) => !isOneSidedBranch(pool, branchId),
      );
    }
    if (regionBranches.length > 0) return regionBranches;
  }
  return [];
};

const takeReplacementBranch = (
  pool: ReplacementPool,
  regionBranches: string[],
  input: WorkoutInput,
): StoredBranch => {
  const branchId =
    regionBranches[Math.floor(input.random() * regionBranches.length)];
  pool.candidates = pool.candidates.filter(
    (candidate) => candidate !== branchId,
  );
  const exerciseId = pool.resolveExerciseId(branchId);
  if (exerciseId) pool.usedExerciseIds.add(exerciseId);
  const branch = pool.skillTree[branchId];
  const chosenRegion = getTagValues(branch.tags, TagGroups.REGION)[0];
  pool.branchesByRegion[chosenRegion] =
    (pool.branchesByRegion[chosenRegion] ?? 0) +
    (isOneSidedBranch(pool, branchId) ? 2 : 1);
  return { branchId, branch };
};

const pickReplacementBranches = (
  pool: ReplacementPool,
  replace: readonly string[],
  input: WorkoutInput,
): StoredBranch[] => {
  const isUnusedExercise = (branchId: string): boolean => {
    const exerciseId = pool.resolveExerciseId(branchId);
    return exerciseId === null || !pool.usedExerciseIds.has(exerciseId);
  };
  const replacement: StoredBranch[] = [];
  for (const region of replace) {
    pool.candidates = pool.candidates.filter(isUnusedExercise);
    // no branch left for this slot; the next slot tries again
    if (pool.candidates.length === 0) continue;
    const ownRegionBranches = listRegionBranches(pool, region);
    const regionBranches =
      ownRegionBranches.length > 0
        ? ownRegionBranches
        : listLessUsedRegionBranches(pool);
    if (regionBranches.length === 0) break;
    replacement.push(takeReplacementBranch(pool, regionBranches, input));
  }
  return replacement;
};

/**
 * Refills the requested regions from the skill tree the context selects. Each
 * slot takes a branch of its region, else of the least used region below the
 * region cap (5, PROFESSIONAL 6), and never a branch whose exercise the block
 * already holds. A prevention or special warm-up skill gets every slot or none.
 */
export const replaceBlockedBranches = (
  request: BranchReplacementRequest,
  input: WorkoutInput,
): StoredBranch[] => {
  requireWorkoutData(input.athlete);
  const skillTree = selectReplacementSkillTree(
    request.skill,
    request.replace.length,
    input,
  );
  if (Object.keys(skillTree).length === 0) return [];
  const replacement = pickReplacementBranches(
    buildReplacementPool(skillTree, request, input),
    request.replace,
    input,
  );
  return isPreventionOrSpecialWarmUpSkill(request.skill) &&
    replacement.length < request.replace.length
    ? []
    : replacement;
};

import { TagGroups } from "@/constants/tagGroups";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import { getBranchIdsByNames } from "@/features/training/utils/skillTreeUtils";
import { resolveBranchExercise } from "@/features/training/workoutGenerator/blockHandlers/library/branchResolution";
import type { RegionTagEntry } from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import type { PlanGenerationInput } from "../planGenerationInput/planGenerationInput";
import {
  applyBranchRuleChain,
  type BranchRuleChainDay,
} from "../ruleFamilies/branchRuleChain";
import type { SlotCandidate } from "./branchSlotFilters";
import type { DerivedProfile } from "./profileDerivation";
import { selectSkillTree } from "./skillTreeSelection";

/** The day a skill selection reads, besides the skill's own request. */
export interface SelectionDay extends BranchRuleChainDay {
  /** The prevention skills of the day, whose regions the special warm-up reads. */
  readonly preventionSkills: readonly string[];
  /** The movement direction configuration the lower body follows. */
  readonly lowerBodyDirections: "LOWER_BODY" | "LOWER_BODY_GKS";
}

/** Everything a tag entry of one skill reads besides its own tags. */
export interface SkillContext {
  readonly skill: string;
  /** The day's place, prevention skills, lower body directions and the branches the day holds so far. */
  readonly day: SelectionDay;
  readonly profile: DerivedProfile;
  readonly input: PlanGenerationInput;
}

export type MovementRegion = "UPPER_BODY" | "LOWER_BODY" | "CORE" | "FULL_BODY";

/** The candidates of one tag entry and the region its movement directions follow. */
export interface EntryPool {
  readonly candidates: readonly SlotCandidate[];
  readonly region: MovementRegion | null;
}

const MOVEMENT_REGIONS: readonly string[] = [
  "UPPER_BODY",
  "LOWER_BODY",
  "CORE",
  "FULL_BODY",
];

const isMovementRegion = (region: string): region is MovementRegion =>
  MOVEMENT_REGIONS.includes(region);

/**
 * Draws one item through the random source.
 *
 * drawItem(["a", "b"], () => 0.7) → "b"
 */
export const drawItem = <T>(items: readonly T[], random: () => number): T =>
  items[Math.min(items.length - 1, Math.floor(random() * items.length))];

/** Checks whether the training place of the day has weights. */
export const isPlaceWeighted = ({ day, input }: SkillContext): boolean =>
  hasWeights([...(input.trainingPlaces[day.place]?.equipment ?? [])]);

/** Filters a tree through the rule chain and drops branches that resolve to nothing. */
const listUsableCandidates = (
  tree: SkillTreeType,
  { day, profile, input }: SkillContext,
): readonly SlotCandidate[] =>
  Object.entries(applyBranchRuleChain(tree, day, profile, input).keep).flatMap(
    ([branchId, branch]) => {
      const exercise = resolveBranchExercise(
        branch,
        profile.fitnessLevel,
        input.authoredData.exerciseCatalog,
        input.exerciseData[branchId] ?? null,
      );
      return exercise ? [{ branchId, branch, exercise }] : [];
    },
  );

const keepRegion = (tree: SkillTreeType, region: string): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tree).filter(([, { tags }]) =>
      getTagValues(tags, TagGroups.REGION).includes(region),
    ),
  );

const SPECIAL_WARM_UP = "WUSPEZIAL";

interface PainRegionTarget {
  readonly group: TagGroups;
  readonly regions: readonly string[];
}

// A prevention skill reads its own region group, pain spec "Each prevention
// skill draws from the region group it covers". The special warm-up reads the
// regions of the day's prevention skills, as the old generator does:
// utils/skillTreeUtils.ts#L213-L231
const readPainRegionTarget = (
  name: string,
  { day, input }: SkillContext,
): PainRegionTarget | null => {
  const { preventionRegions } = input.authoredData;
  if (Object.hasOwn(preventionRegions, name)) {
    return { group: TagGroups.PREVENTION, regions: preventionRegions[name] };
  }
  if (name !== SPECIAL_WARM_UP) return null;
  return {
    group: TagGroups.PAIN,
    regions: day.preventionSkills.flatMap((skill) => preventionRegions[skill]),
  };
};

// Keeps the whole tree when no branch matches, as the old generator does:
// utils/skillTreeUtils.ts#L135-L156, #L213-L231
const keepPainRegions = (
  tree: SkillTreeType,
  name: string,
  context: SkillContext,
): SkillTreeType => {
  const target = readPainRegionTarget(name, context);
  if (target === null) return tree;
  const kept = Object.fromEntries(
    Object.entries(tree).filter(([, { tags }]) =>
      getTagValues(tags, target.group).some((region) =>
        target.regions.includes(region),
      ),
    ),
  );
  return Object.keys(kept).length > 0 ? kept : tree;
};

// The max strength rowing name maps to branch 141, which MAX.json keeps empty;
// the old generator reads branch 142 instead:
// generators/PlanGenerator.ts#L1467-L1470, #L1508-L1521
const STAND_IN_BRANCH_IDS: Readonly<Record<string, string>> = { "141": "142" };

const replaceStandIn = (branchId: string): string =>
  Object.hasOwn(STAND_IN_BRANCH_IDS, branchId)
    ? STAND_IN_BRANCH_IDS[branchId]
    : branchId;

// Named branches may sit in any skill tree.
const readNamedBranches = (
  names: readonly string[],
  { skill, input }: SkillContext,
): SkillTreeType => {
  const allBranches: SkillTreeType = Object.assign(
    {},
    ...Object.values(input.authoredData.skillTrees),
  );
  return Object.fromEntries(
    getBranchIdsByNames([...names], skill)
      .map(replaceStandIn)
      .filter((branchId) => Object.hasOwn(allBranches, branchId))
      .map((branchId) => [branchId, allBranches[branchId]]),
  );
};

/**
 * Reads the candidates of a tag entry, each through the rule chain and the
 * branch resolution:
 * - region tags: the skill tree branches of the region, drawn when the entry
 *   names several
 * - skill tags: the tree of one skill tag, drawn among the trees that keep a
 *   candidate
 * - exercise name tags: the named branches
 * - no tags: the whole skill tree
 *
 * readEntryPool({ tags: ["REGION_CORE"], count: 2 }, context)
 * → { candidates: [<core branches the athlete may train>], region: "CORE" }
 */
export const readEntryPool = (
  { tags }: RegionTagEntry,
  context: SkillContext,
): EntryPool => {
  const { skill, input } = context;
  const placeHasWeights = isPlaceWeighted(context);
  const regions = getTagValues(tags, TagGroups.REGION);
  const skillTags = getTagValues(tags, TagGroups.SKILL);
  const names = getTagValues(tags, TagGroups.EXERCISE_NAME);
  const readTree = (name: string) =>
    keepPainRegions(
      selectSkillTree(name, placeHasWeights, input.authoredData.skillTrees),
      name,
      context,
    );
  if (regions.length > 0) {
    const region =
      regions.length > 1 ? drawItem(regions, input.random) : regions[0];
    return {
      candidates: listUsableCandidates(
        keepRegion(readTree(skill), region),
        context,
      ),
      region: isMovementRegion(region) ? region : null,
    };
  }
  if (skillTags.length > 0) {
    const usable = skillTags
      .map((skillTag) => listUsableCandidates(readTree(skillTag), context))
      .filter((candidates) => candidates.length > 0);
    return {
      candidates:
        usable.length > 1 ? drawItem(usable, input.random) : (usable[0] ?? []),
      region: null,
    };
  }
  const tree =
    names.length > 0 ? readNamedBranches(names, context) : readTree(skill);
  return { candidates: listUsableCandidates(tree, context), region: null };
};

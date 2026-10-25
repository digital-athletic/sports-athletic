import { TagGroups } from "@/constants/tagGroups";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  areaToRegion,
  getAreasFor,
} from "@/features/training/utils/exerciseUtils";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import type { BranchLookupIndex } from "../../generationInput/branchLookupIndex";
import { readSkillCatalogEntry } from "../../generationInput/skillCatalogEntry";
import type { WorkoutInput } from "../../stages/workoutSetup";

type SkillTrees = Readonly<Record<string, Readonly<SkillTreeType>>>;

// The tree a skill reads with weights at the place, and without
const TREE_NAMES_BY_SKILL: Readonly<Record<string, readonly [string, string]>> =
  {
    GKS: ["GKS", "GKSKG"],
    GKSKG: ["GKS", "GKSKG"],
    SA: ["SA", "SAKG"],
    SAKG: ["SA", "SAKG"],
    SK: ["SK", "SKKG"],
    SKKG: ["SK", "SKKG"],
    SWR: ["SWR1", "SWR1KG"],
    SWR1: ["SWR1", "SWR1KG"],
    SWR2: ["SWR1", "SWR1KG"],
    SWR1KG: ["SWR1", "SWR1KG"],
    SWR2KG: ["SWR1", "SWR1KG"],
    MOBILITY: ["MOB", "MOB"],
    WARMUP: ["WU", "WU"],
    FOAM_ROLLER: ["BR", "BR"],
    STABILITY: ["BAS", "GKS"],
    CARDIO: ["CD", "CD"],
    PREVENTION: ["PREV", "PREVKG"],
    SUPPORT: ["SUPPORT", "SUPPORT"],
  };

// Plyometric intensities are tags inside the PLYO tree; medium and low are one category
const PLYO_TAGS_BY_SKILL: Readonly<Record<string, readonly string[]>> = {
  PLYO_HIGH: ["SKILL_PLYO_HIGH"],
  PLYO_MEDIUM: ["SKILL_PLYO_MEDIUM", "SKILL_PLYO_LOW"],
  PLYO_LOW: ["SKILL_PLYO_MEDIUM", "SKILL_PLYO_LOW"],
};

const PREVENTION_SKILLS = [
  "PREVKNEE",
  "PREVSHOULDER",
  "PREVANKLE",
  "PREVSPINE",
  "PREVWRIST",
];

const SPECIAL_WARM_UP_SKILL = "WUSPEZIAL";

const skillTreesByIndex = new WeakMap<BranchLookupIndex, SkillTrees>();

// Every registry tree name starts empty, so a tree without branches in the
// index reads as an empty tree.
const groupBranchesBySkillTree = (
  branchLookupIndex: BranchLookupIndex,
): SkillTrees => {
  const cached = skillTreesByIndex.get(branchLookupIndex);
  if (cached) return cached;
  const skillTrees: Record<string, SkillTreeType> = Object.fromEntries(
    Object.keys(getAllSkillTrees()).map((skillTreeName) => [skillTreeName, {}]),
  );
  for (const {
    branchId,
    skillTreeName,
    branch,
  } of branchLookupIndex.values()) {
    skillTrees[skillTreeName] ??= {};
    skillTrees[skillTreeName][branchId] = branch;
  }
  skillTreesByIndex.set(branchLookupIndex, skillTrees);
  return skillTrees;
};

const readSkillTree = (skillTrees: SkillTrees, name: string): SkillTreeType =>
  Object.hasOwn(skillTrees, name) ? skillTrees[name] : {};

const keepBranches = (
  tree: SkillTreeType,
  isKept: (branch: SkillTreeType[string]) => boolean,
): SkillTreeType =>
  Object.fromEntries(
    Object.entries(tree).filter(([, branch]) => isKept(branch)),
  );

/**
 * Removes the branches of the sore region, and throws for muscle soreness in
 * two areas. Prevention and special warm-up skills are no cardio skills and
 * never ignore muscle soreness. Soreness tags count in any letter case.
 */
const keepBranchesOutsideSoreRegion = (
  tree: SkillTreeType,
  input: WorkoutInput,
): SkillTreeType => {
  const soreAreas = getAreasFor(
    input.muscleSoreness.map(({ tag }) => tag.toUpperCase()),
  );
  const soreRegions = soreAreas.map(areaToRegion);
  if (soreAreas.length > 1) {
    // the muscle soreness family throws the same raw object, so callers
    // read both alike
    throw {
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: soreRegions,
    };
  }
  return keepBranches(
    tree,
    ({ tags }) =>
      !getTagValues(tags, TagGroups.REGION).some((region) =>
        soreRegions.includes(region),
      ),
  );
};

interface PreventionRegionSource {
  readonly tree: SkillTreeType;
  /** PREVENTION in the prevention trees, PAIN in the special warm-up tree. */
  readonly regionTagGroup: TagGroups;
}

/**
 * Takes the branches of the first prevention skill's pain regions that still
 * fill every slot after the muscle soreness check, or none.
 */
const findPreventionRegionTree = (
  { tree, regionTagGroup }: PreventionRegionSource,
  preventionSkills: readonly string[],
  slotCount: number,
  input: WorkoutInput,
): SkillTreeType => {
  for (const preventionSkill of preventionSkills) {
    const regions =
      readSkillCatalogEntry(input.skillCatalog, preventionSkill)?.painRegions ??
      [];
    const regionTree = keepBranchesOutsideSoreRegion(
      keepBranches(tree, ({ tags }) =>
        getTagValues(tags, regionTagGroup).some((region) =>
          regions.includes(region),
        ),
      ),
      input,
    );
    if (Object.keys(regionTree).length >= slotCount) return regionTree;
  }
  return {};
};

// A prevention skill tries its own region first, then the regions of the
// athlete's other prevention skills. Without prevention skills it gets none.
const selectPreventionTree = (
  skillTrees: SkillTrees,
  skill: string,
  slotCount: number,
  input: WorkoutInput,
): SkillTreeType => {
  const { preventionSkills } = input;
  return findPreventionRegionTree(
    {
      tree: readSkillTree(skillTrees, input.hasWeights ? "PREV" : "PREVKG"),
      regionTagGroup: TagGroups.PREVENTION,
    },
    preventionSkills.length > 0
      ? [skill, ...preventionSkills.filter((other) => other !== skill)]
      : [],
    slotCount,
    input,
  );
};

const selectSkillTree = (
  skillTrees: SkillTrees,
  skill: string,
  slotCount: number,
  input: WorkoutInput,
): SkillTreeType => {
  if (PREVENTION_SKILLS.includes(skill)) {
    return selectPreventionTree(skillTrees, skill, slotCount, input);
  }
  if (skill === SPECIAL_WARM_UP_SKILL) {
    return findPreventionRegionTree(
      {
        tree: readSkillTree(skillTrees, SPECIAL_WARM_UP_SKILL),
        regionTagGroup: TagGroups.PAIN,
      },
      input.preventionSkills,
      slotCount,
      input,
    );
  }
  if (Object.hasOwn(PLYO_TAGS_BY_SKILL, skill)) {
    const intensityTags = PLYO_TAGS_BY_SKILL[skill];
    return keepBranches(readSkillTree(skillTrees, "PLYO"), ({ tags }) =>
      tags.some((tag) => intensityTags.includes(tag)),
    );
  }
  if (skill === "ALL") return Object.assign({}, ...Object.values(skillTrees));
  if (Object.hasOwn(TREE_NAMES_BY_SKILL, skill)) {
    const [withWeights, withoutWeights] = TREE_NAMES_BY_SKILL[skill];
    return readSkillTree(
      skillTrees,
      input.hasWeights ? withWeights : withoutWeights,
    );
  }
  return readSkillTree(skillTrees, skill);
};

/**
 * Selects the skill tree that refills the blocked slots of a skill, from the
 * catalog branches of the branch lookup index:
 * - a skill with a weighted and a bodyweight tree reads the one the place's
 *   weights select
 * - a plyometric intensity keeps the PLYO branches tagged with it
 * - a prevention or special warm-up skill narrows to one prevention region
 *   with a branch for every slot; replacement asks for one slot or more
 * - a branch without levels drops out
 *
 * selectReplacementSkillTree("GKS", 1, input without weights) → the GKSKG tree
 */
export const selectReplacementSkillTree = (
  skill: string,
  slotCount: number,
  input: WorkoutInput,
): SkillTreeType =>
  keepBranches(
    selectSkillTree(
      groupBranchesBySkillTree(input.branchLookupIndex),
      skill,
      slotCount,
      input,
    ),
    ({ levels }) => Object.keys(levels ?? {}).length > 0,
  );

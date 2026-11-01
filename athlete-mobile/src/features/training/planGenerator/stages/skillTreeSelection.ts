import type { PlanAuthoredData } from "@/data/loadPlanAuthoredData";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import {
  isPlyometricIntensity,
  keepPlyometricIntensity,
} from "@/features/training/utils/plyometricIntensity";
import type { SkillTreeType } from "@/schemas/skillTree.schema";

// The weighted tree and the bodyweight tree of a skill trainable both ways
const TREE_PAIRS_BY_SKILL: Readonly<Record<string, readonly [string, string]>> =
  {
    GKS: ["GKS", "GKSKG"],
    GKSKG: ["GKS", "GKSKG"],
    SA: ["SA", "SAKG"],
    SAKG: ["SA", "SAKG"],
    SK: ["SK", "SKKG"],
    SKKG: ["SK", "SKKG"],
    SWR1: ["SWR1", "SWR1KG"],
    SWR2: ["SWR1", "SWR1KG"],
    SWR1KG: ["SWR1", "SWR1KG"],
    SWR2KG: ["SWR1", "SWR1KG"],
    PREVKNEE: ["PREV", "PREVKG"],
    PREVSHOULDER: ["PREV", "PREVKG"],
    PREVANKLE: ["PREV", "PREVKG"],
    PREVSPINE: ["PREV", "PREVKG"],
    PREVWRIST: ["PREV", "PREVKG"],
  };

// Both max strength skills read one tree.
const TREE_NAMES_BY_SKILL: Readonly<Record<string, string>> = {
  MAX_STRENGTH: "MAX",
};

// A skill tree the authored data lacks raises the configuration error OTHER/OTHER.
const readTree = (
  skillTrees: PlanAuthoredData["skillTrees"],
  name: string,
): SkillTreeType => {
  if (Object.hasOwn(skillTrees, name)) return skillTrees[name];
  throw {
    type: "OTHER",
    subtype: "OTHER",
    params: ["skillTree", name],
  } satisfies GeneratorError;
};

/**
 * Selects the skill tree a skill or skill tag reads. A skill trainable with
 * and without weights reads both trees at a place with weights, so the
 * weighted/bodyweight share can draw from both, and only the bodyweight tree
 * elsewhere. A plyometric intensity keeps the PLYO branches tagged with it.
 *
 * selectSkillTree("SWR2KG", true, skillTrees) → the SWR1 and SWR1KG branches
 * selectSkillTree("SWR2KG", false, skillTrees) → the SWR1KG branches
 */
export const selectSkillTree = (
  name: string,
  placeHasWeights: boolean,
  skillTrees: PlanAuthoredData["skillTrees"],
): SkillTreeType => {
  if (isPlyometricIntensity(name)) {
    return keepPlyometricIntensity(readTree(skillTrees, "PLYO"), name);
  }
  if (Object.hasOwn(TREE_PAIRS_BY_SKILL, name)) {
    const [weighted, bodyweight] = TREE_PAIRS_BY_SKILL[name];
    return placeHasWeights
      ? {
          ...readTree(skillTrees, weighted),
          ...readTree(skillTrees, bodyweight),
        }
      : readTree(skillTrees, bodyweight);
  }
  return readTree(
    skillTrees,
    Object.hasOwn(TREE_NAMES_BY_SKILL, name) ? TREE_NAMES_BY_SKILL[name] : name,
  );
};

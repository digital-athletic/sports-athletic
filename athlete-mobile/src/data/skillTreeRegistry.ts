/**
 * Skill Tree Registry
 *
 * Module-level singleton registry for skill tree data.
 * Provides lazy initialization and direct access to all skill trees.
 *
 * This replaces the Zustand-based skillTreesStore with a simpler,
 * non-persisted approach since skill trees are bundled static data.
 */

import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { SkillTree } from "@/constants/workoutConstants";
import { loadSkillTree } from "./loadSkillTrees";

// List of all available skill tree names
const SKILL_TREE_NAMES: SkillTree[] = [
  "BAS",
  "BR",
  "CARDIO_1_LAKTAT",
  "CARDIO_1_SHORT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
  "CD",
  "GKS",
  "GKSKG",
  "MAX",
  "MOB",
  "PLYO",
  "PREV",
  "PREVKG",
  "SA",
  "SAKG",
  "SASPEZIAL",
  "SK",
  "SKKG",
  "SWR1",
  "SWR1KG",
  "WU",
  "WUSKSA",
  "WUSPEZIAL",
];

// Module-level singleton state
let skillTreeRegistry: Record<string, SkillTreeType> | null = null;

/**
 * Initializes the skill tree registry if not already initialized.
 * Uses lazy initialization - data is loaded on first access.
 */
function ensureInitialized(): void {
  if (skillTreeRegistry === null) {
    skillTreeRegistry = {};

    for (const skillName of SKILL_TREE_NAMES) {
      skillTreeRegistry[skillName] = loadSkillTree(skillName);
    }
  }
}

/**
 * Gets a skill tree by its name.
 *
 * @param name - The skill tree name to look up
 * @returns The skill tree if found, undefined otherwise
 */
export function getSkillTree(name: SkillTree): SkillTreeType | undefined {
  ensureInitialized();
  return skillTreeRegistry![name];
}

/**
 * Gets all skill trees as a Record.
 * Compatible with the previous SkillTreesState['skillTrees'] type.
 *
 * @returns Record of all skill trees keyed by name
 */
export function getAllSkillTrees(): Record<string, SkillTreeType> {
  ensureInitialized();
  return skillTreeRegistry!;
}

/**
 * Gets an array of all available skill tree names.
 *
 * @returns Array of skill tree names
 */
export function getSkillTreeNames(): string[] {
  ensureInitialized();
  return Object.keys(skillTreeRegistry!);
}

/**
 * Clears the registry, allowing re-initialization.
 * Primarily used for testing purposes.
 */
export function clearSkillTreeRegistry(): void {
  skillTreeRegistry = null;
}

/**
 * Type alias for backward compatibility with skillTreeUtils.ts
 * which imports SkillTreesState from the store.
 */
export type SkillTreesState = {
  skillTrees: Record<string, SkillTreeType>;
};

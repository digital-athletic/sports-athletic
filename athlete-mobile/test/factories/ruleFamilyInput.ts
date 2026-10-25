import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  generateGenerationInput,
  type GenerationInputFactoryOptions,
} from "./generationInput";

/**
 * Builds the generation input of the rule family specs: the general
 * generation input with its defaults (adult man, ADVANCED, studio).
 *
 * generateRuleFamilyInput({ soreMuscles: ["CHEST"], equipment: ["DUMBBELL"] })
 * → { athlete: { personalData: { gender: "MALE", birthday: "1990-06-15" },
 *       workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] } },
 *       temporalData: [{ tag: "CHEST", ... }] },
 *     muscleSoreness: [{ tag: "CHEST", ... }], equipment: ["DUMBBELL"], exerciseCatalog: [], ... }
 */
export const generateRuleFamilyInput = (
  options: GenerationInputFactoryOptions = {},
): GenerationInput => generateGenerationInput(options);

/**
 * Cuts the named branches out of a real skill tree. Numeric branch IDs keep
 * ascending key order, as in every branch record of the generator. Throws for
 * an unknown tree name or branch ID.
 *
 * generateSkillTreeBranches("GKS", ["510", "523"])
 * → { "510": { tags: ["EQ_DUMBBELL", ...], levels: {...} }, "523": {...} }
 */
export const generateSkillTreeBranches = (
  treeName: string,
  branchIds: string[],
): SkillTreeType => {
  const skillTrees = getAllSkillTrees();
  if (!Object.hasOwn(skillTrees, treeName)) {
    throw new Error(`Unknown skill tree ${treeName}`);
  }
  const tree = skillTrees[treeName];
  return Object.fromEntries(
    branchIds.map((id) => {
      if (!Object.hasOwn(tree, id)) {
        throw new Error(`Unknown branch ${id} in skill tree ${treeName}`);
      }
      return [id, tree[id]];
    }),
  );
};

import type { LevelTag } from "@/constants/workoutConstants";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  createGenerationInput,
  type GenerationInput,
} from "@/features/training/workoutGenerator/generationInput";

interface RuleFamilyInputOptions {
  level?: LevelTag;
  soreMuscles?: string[];
  equipment?: string[];
  exerciseCatalog?: ExerciseType[];
}

/**
 * Builds the generation input of the rule family specs. The default athlete
 * has fitness level ADVANCED and no muscle soreness.
 *
 * generateRuleFamilyInput({ soreMuscles: ["CHEST"], equipment: ["DUMBBELL"] })
 * → { athlete: { workoutData: { tags: { LEVEL: ["ADVANCED"] } },
 *       temporalData: [{ tag: "CHEST", ... }] },
 *     muscleSoreness: [{ tag: "CHEST", ... }], equipment: ["DUMBBELL"], exerciseCatalog: [], ... }
 */
export const generateRuleFamilyInput = ({
  level = "ADVANCED",
  soreMuscles = [],
  equipment = [],
  exerciseCatalog = [],
}: RuleFamilyInputOptions = {}): GenerationInput =>
  createGenerationInput({
    athlete: {
      userId: "athlete",
      workoutData: { tags: { LEVEL: [level] } },
      temporalData: soreMuscles.map((tag) => ({
        tag,
        date: "2026-10-24",
        expiration: "2026-10-25",
      })),
    },
    place: "STUDIO",
    equipment,
    exerciseCatalog,
    exerciseData: { exerciseData: {}, branchData: {} },
  });

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

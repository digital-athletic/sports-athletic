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
  birthday?: string;
  gender?: "MALE" | "FEMALE";
  pains?: string[];
  soreMuscles?: string[];
  equipment?: string[];
  exerciseCatalog?: ExerciseType[];
}

/**
 * Builds the generation input of the rule family specs. The default athlete
 * is an adult man at fitness level ADVANCED without pains or muscle soreness.
 *
 * generateRuleFamilyInput({ soreMuscles: ["CHEST"], equipment: ["DUMBBELL"] })
 * → { athlete: { personalData: { gender: "MALE", birthday: "1990-06-15" },
 *       workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] } },
 *       temporalData: [{ tag: "CHEST", ... }] },
 *     muscleSoreness: [{ tag: "CHEST", ... }], equipment: ["DUMBBELL"], exerciseCatalog: [], ... }
 */
export const generateRuleFamilyInput = ({
  level = "ADVANCED",
  birthday = "1990-06-15",
  gender = "MALE",
  pains = [],
  soreMuscles = [],
  equipment = [],
  exerciseCatalog = [],
}: RuleFamilyInputOptions = {}): GenerationInput =>
  createGenerationInput({
    athlete: {
      userId: "athlete",
      personalData: { gender, birthday },
      workoutData: { tags: { LEVEL: [level], PAIN: pains } },
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

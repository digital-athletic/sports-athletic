import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { generateGenerationInput } from "./generationInput";
import { generateTreeCatalogEntry } from "./skillCatalog";
import { generateLowerBodyExercises } from "./valueExercise";

/**
 * Builds the generation input of a beginner whose catalog contains the lower
 * body exercises e1 to e9, with the skill SYN that reads the tree T_A, e.g.
 * generatePicksGenerationInput().skillCatalog
 * → { SYN: { skillTree: { withoutWeights: ["T_A"], ... }, ... } }.
 */
export const generatePicksGenerationInput = (): GenerationInput => ({
  ...generateGenerationInput({
    level: "BEGINNER",
    exerciseCatalog: generateLowerBodyExercises([
      "e1",
      "e2",
      "e3",
      "e4",
      "e5",
      "e6",
      "e7",
      "e8",
      "e9",
    ]),
    random: () => 0,
  }),
  skillCatalog: { SYN: generateTreeCatalogEntry() },
});

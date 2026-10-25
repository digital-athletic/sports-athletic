import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  setUpWorkout,
  type WorkoutInput,
} from "@/features/training/workoutGenerator/stages/workoutSetup";
import {
  generateGenerationInput,
  type GenerationInputFactoryOptions,
} from "./generationInput";
import { generateLowerBodyExercises } from "./valueExercise";

export interface WorkoutInputFactoryOptions
  extends GenerationInputFactoryOptions {
  /** The template whose selections workout rules the setup applies. */
  template?: Template;
  /** The skill trees the selections of the template draw from. */
  selectionsBlockSkillTrees?: Record<string, SkillTreeType>;
}

/**
 * Builds the input that workout setup hands to the selections workout rules:
 * the general generation input plus the athlete level that setup derives.
 *
 * generateLeveledInput({ pains: ["KNEE_LEFT"] })
 * → { athlete: { workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] } }, ... },
 *     athleteLevel: "ADVANCED", ... }
 */
export const generateLeveledInput = (
  options: GenerationInputFactoryOptions = {},
): GenerationInput & { readonly athleteLevel: string } => {
  const input = generateGenerationInput(options);
  return { ...input, athleteLevel: getUserLevel(input.athlete) };
};

/**
 * Builds the workout input of a generation input: the general generation
 * input with its defaults, set up for the template.
 *
 * generateWorkoutInput({ pains: ["KNEE_LEFT"], skillTrees: { BAS: { "1": branch } } })
 * → { athleteLevel: "ADVANCED", blockedRegions: ["KNEE"], preventionSkills: ["PREVKNEE"],
 *     hasWeights: false, selectionsWorkout: { pool: {}, blocks: Map {} }, ... }
 */
export const generateWorkoutInput = ({
  template,
  selectionsBlockSkillTrees,
  ...generationOptions
}: WorkoutInputFactoryOptions = {}): WorkoutInput =>
  setUpWorkout(
    generateGenerationInput(generationOptions),
    template,
    selectionsBlockSkillTrees,
  );

/**
 * Builds the workout input of the replacement specs: the workout input of a
 * beginner whose catalog holds the lower body exercises e1, e2 and e3 and
 * whose draws always return 0. The options replace any default.
 *
 * generateReplacementInput({ skillTrees: { BAS: { "1": branch } } })
 * → beginner athlete, branch lookup index over BAS, random always 0
 */
export const generateReplacementInput = (
  options: WorkoutInputFactoryOptions & {
    skillTrees: Record<string, SkillTreeType>;
  },
): WorkoutInput =>
  generateWorkoutInput({
    level: "BEGINNER",
    exerciseCatalog: generateLowerBodyExercises(["e1", "e2", "e3"]),
    random: () => 0,
    ...options,
  });

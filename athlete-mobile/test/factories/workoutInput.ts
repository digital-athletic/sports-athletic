import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  setUpWorkout,
  type WorkoutInput,
} from "@/features/training/workoutGenerator/workoutSetup";
import {
  generateGenerationInput,
  type GenerationInputFactoryOptions,
} from "./generationInput";

export interface WorkoutInputFactoryOptions
  extends GenerationInputFactoryOptions {
  /** The template whose picks workout rules the setup applies. */
  template?: Template;
  /** The skill trees the picks of the template draw from. */
  pickTrees?: Record<string, SkillTreeType>;
}

/**
 * Builds the input that workout setup hands to the picks workout rules: the
 * general generation input plus the athlete level that setup derives.
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
 *     hasWeights: false, picksWorkout: { pool: {}, blocks: Map {} }, ... }
 */
export const generateWorkoutInput = ({
  template,
  pickTrees,
  ...generationOptions
}: WorkoutInputFactoryOptions = {}): WorkoutInput =>
  setUpWorkout(generateGenerationInput(generationOptions), template, pickTrees);

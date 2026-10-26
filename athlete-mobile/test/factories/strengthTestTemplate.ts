import type { PicksBlock } from "@/schemas/aiwl.schema";
import type { StrengthTestTemplate } from "@/schemas/strengthTestTemplate.schema";
import { generateExercisesBlock } from "./exercisesBlock";
import { generateStrengthTestWarmUpBlock } from "./strengthTestWarmUp";
import { generateBundledTestSets, type TestSets } from "./testSets";

interface StrengthTestTemplateOptions {
  warmUp?: Partial<PicksBlock>;
  exercises?: string[];
  testSets?: TestSets;
  blocks?: StrengthTestTemplate["blocks"];
}

/**
 * Builds a strength test template as the bundled TEST.json authors it: the
 * warm up of the region quotas, then the lifts with their test sets. The
 * options replace the warm up fields, the lifts or the test sets; blocks
 * replaces the whole block list, for templates that break the layout.
 *
 * generateStrengthTestTemplate({ exercises: ["25"] })
 * → { aiwl: 1, id: "TEST", name: { en: "Strength test" },
 *     blocks: [{ kind: "picks", skill: "WU", ... },
 *              { kind: "exercises", skill: "TEST", exercises: ["25"], testSets: [...4 sets] }] }
 */
export const generateStrengthTestTemplate = ({
  warmUp = {},
  exercises = ["25", "50", "342", "297", "54"],
  testSets = generateBundledTestSets(),
  blocks,
}: StrengthTestTemplateOptions = {}): StrengthTestTemplate => ({
  aiwl: 1,
  id: "TEST",
  name: { en: "Strength test" },
  blocks: blocks ?? [
    generateStrengthTestWarmUpBlock(warmUp),
    generateExercisesBlock(exercises, "TEST", { testSets }),
  ],
});

import type { SkillCode } from "@/schemas/generator.schema";
import type { SetListBlock } from "@/features/training/workoutGenerator/setListBuilder";

/**
 * Builds a block of 2 sets resting 30 s within a superset, 90 s between sets
 * and 60 s after an exercise. The overrides replace any field.
 *
 * generateSetListBlock("SWR2", { sets: 1 })
 * → { skill: "SWR2", minutes: 30, sets: 1,
 *     rest: { withinSuperset: 30, betweenSets: 90, afterExercise: 60 } }
 */
export const generateSetListBlock = (
  skill: SkillCode,
  overrides: Partial<SetListBlock> = {},
): SetListBlock => ({
  skill,
  minutes: 30,
  sets: 2,
  rest: { withinSuperset: 30, betweenSets: 90, afterExercise: 60 },
  ...overrides,
});

/**
 * Builds a cardio block of one set that rests 10 s everywhere. The overrides
 * replace any field.
 *
 * generateCardioSetListBlock("CARDIO_2", 3)
 * → { skill: "CARDIO_2", minutes: 3, sets: 1,
 *     rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 } }
 */
export const generateCardioSetListBlock = (
  skill: SkillCode,
  minutes: number,
  overrides: Partial<SetListBlock> = {},
): SetListBlock =>
  generateSetListBlock(skill, {
    minutes,
    sets: 1,
    rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    ...overrides,
  });

/**
 * Builds the max strength block: 4 sets resting 180 s between sets. The
 * builder reads only its skill.
 *
 * generateMaxStrengthBlock()
 * → { skill: "MAX_STRENGTH", minutes: 0, sets: 4,
 *     rest: { withinSuperset: 0, betweenSets: 180, afterExercise: 120 } }
 */
export const generateMaxStrengthBlock = (): SetListBlock =>
  generateSetListBlock("MAX_STRENGTH", {
    minutes: 0,
    sets: 4,
    rest: { withinSuperset: 0, betweenSets: 180, afterExercise: 120 },
  });

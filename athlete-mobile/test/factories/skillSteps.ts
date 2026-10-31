import type { SkillSteps } from "@/features/training/planGenerator/trainingDayDraw";

/**
 * Builds the region table steps of one skill for the training day draw: 1 to 3
 * exercises in steps of 10 minutes and a cap of 30 minutes, unless the
 * overrides set other values.
 *
 * generateSkillSteps({ skill: "MAX", maxMinutes: 20 })
 * → { skill: "MAX", steps: [{ minutes: 10, exerciseCount: 1 }, { minutes: 20, exerciseCount: 2 }, { minutes: 30, exerciseCount: 3 }], maxMinutes: 20 }
 */
export const generateSkillSteps = (
  overrides: Partial<SkillSteps> = {},
): SkillSteps => ({
  skill: "STRENGTH",
  steps: [
    { minutes: 10, exerciseCount: 1 },
    { minutes: 20, exerciseCount: 2 },
    { minutes: 30, exerciseCount: 3 },
  ],
  maxMinutes: 30,
  ...overrides,
});

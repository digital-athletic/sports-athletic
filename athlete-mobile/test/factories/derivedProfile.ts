import type { DerivedProfile } from "@/features/training/planGenerator/stages/profileDerivation";

/**
 * Builds the result of profile derivation: an adult field player at fitness
 * level ADVANCED without pain, in an 8-week preparatory phase, with weights.
 *
 * generateDerivedProfile({ fitnessLevel: "BEGINNER" })
 * → { ageGroup: "ADULT", fitnessLevel: "BEGINNER", hasPain: false,
 *     preventionSkills: [], playingPositionGroup: "FIELD_PLAYER",
 *     seasonPhase: { type: "PREPARATORY", weekCount: 8 }, hasWeights: true }
 */
export const generateDerivedProfile = (
  overrides: Partial<DerivedProfile> = {},
): DerivedProfile => ({
  ageGroup: "ADULT",
  fitnessLevel: "ADVANCED",
  hasPain: false,
  preventionSkills: [],
  playingPositionGroup: "FIELD_PLAYER",
  seasonPhase: { type: "PREPARATORY", weekCount: 8 },
  hasWeights: true,
  ...overrides,
});

import type { UserSkills } from "@/features/statistics/models/WorkoutsData";
import type { FocusArea } from "@/schemas/sync.schema";

/**
 * Order matches design: MOBILITY (top), PREVENTION (top-right),
 * CARDIO (bottom-right), STABILITY (bottom), WARMUP (bottom-left), SWR (top-left)
 */
export const SKILL_ORDER: FocusArea[] = [
  "MOBILITY",
  "PREVENTION",
  "CARDIO",
  "STABILITY",
  "WARMUP",
  "SWR",
];

/**
 * Calculates percentage distribution of skills from raw skill values.
 * Each skill's percentage is calculated as (skillValue / totalValue) * 100.
 * Returns 0 for all skills if total is 0.
 */
export const calculatePercentages = (
  userSkills: UserSkills,
): Record<FocusArea, number> => {
  const total = Object.values(userSkills).reduce(
    (sum, value) => sum + value,
    0,
  );

  if (total === 0) {
    return {
      MOBILITY: 0,
      PREVENTION: 0,
      CARDIO: 0,
      STABILITY: 0,
      WARMUP: 0,
      SWR: 0,
    };
  }

  return {
    MOBILITY: (userSkills.MOBILITY / total) * 100,
    PREVENTION: (userSkills.PREVENTION / total) * 100,
    CARDIO: (userSkills.CARDIO / total) * 100,
    STABILITY: (userSkills.STABILITY / total) * 100,
    WARMUP: (userSkills.WARMUP / total) * 100,
    SWR: (userSkills.SWR / total) * 100,
  };
};

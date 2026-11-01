import type { PlanAuthoredData } from "@/data/loadPlanAuthoredData";
import type { RegionTagEntry } from "@/schemas/generator.schema";

/**
 * Builds a tag entry that asks for the given number of exercises of one tag.
 *
 * generateRegionTagEntry("REGION_CORE", 2) → { tags: ["REGION_CORE"], count: 2 }
 */
export const generateRegionTagEntry = (
  tag: string,
  count: number,
): RegionTagEntry => ({ tags: [tag], count });

/**
 * Builds the region configurations of the region configuration spec.
 * Hypertrophy stage 1 (SWR1) holds the keys 20, 30 and 40 in its default
 * variant, plus a child and a professional variant. Cardio and max strength
 * (MAX) hold one key each.
 *
 * generateRegionConfigs().SWR1.default["30"] → [{ tags: ["REGION_UPPER_BODY"], count: 3 }]
 */
export const generateRegionConfigs = (): PlanAuthoredData["regionConfigs"] => ({
  SWR1: {
    default: {
      "20": [generateRegionTagEntry("REGION_UPPER_BODY", 2)],
      "30": [generateRegionTagEntry("REGION_UPPER_BODY", 3)],
      "40": [generateRegionTagEntry("REGION_UPPER_BODY", 4)],
    },
    child: { "20": [generateRegionTagEntry("REGION_CORE", 1)] },
    professional: { "20": [generateRegionTagEntry("REGION_LOWER_BODY", 2)] },
  },
  CARDIO: { default: { "10": [{ tags: [], count: 1 }] } },
  MAX: {
    default: { "10": [generateRegionTagEntry("EXERCISE_NAME_SQUAT", 1)] },
  },
});

import { WorkoutConstants } from "@/constants/workoutConstants";
import type { PlanAuthoredData } from "@/data/loadPlanAuthoredData";
import type {
  DurationTagMap,
  RegionConfig,
  RegionTagEntry,
  SkillCode,
} from "@/schemas/generator.schema";
import { throwConfigurationError } from "./configurationError";
import type { DerivedProfile } from "./profileDerivation";
import { isCardioSkill } from "./skillCodes";

/** The tag entries branch selection fills. */
export interface RegionConfiguration {
  readonly tagEntries: readonly RegionTagEntry[];
}

const { AGE_GROUPS, LEVELS } = WorkoutConstants;

/**
 * Every cardio skill and both max strength skills share one configuration.
 * SWR2 reads the SWR1 configuration, as the old generator does:
 * src/features/training/generators/PlanGenerator.ts,
 * PlanGenerator.getTagsForSkill
 */
const readRegionConfigurationName = (skill: SkillCode): string => {
  if (isCardioSkill(skill)) return "CARDIO";
  if (skill === "MAX_STRENGTH") return "MAX";
  if (skill === "SWR2") return "SWR1";
  return skill;
};

const pickVariant = (
  config: RegionConfig,
  { ageGroup, fitnessLevel }: DerivedProfile,
): DurationTagMap => {
  if (ageGroup === AGE_GROUPS.CHILD) return config.child ?? config.default;
  if (fitnessLevel === LEVELS.PROFESSIONAL) {
    return config.professional ?? config.default;
  }
  return config.default;
};

/**
 * Reads the region configuration variant of a skill, keyed by minutes: the
 * child variant for a child, the professional variant for a professional,
 * otherwise the default. A missing variant falls back to the default. A skill
 * without a configuration, or a variant without minute keys, raises the
 * configuration error OTHER/OTHER.
 *
 * readRegionConfigurationVariant("SWR2", advancedAdult, regionConfigs)
 * → { "20": [...], "30": [...], ... } (the SWR1 default variant)
 */
export const readRegionConfigurationVariant = (
  skill: SkillCode,
  profile: DerivedProfile,
  regionConfigs: PlanAuthoredData["regionConfigs"],
): DurationTagMap => {
  const name = readRegionConfigurationName(skill);
  const config = Object.hasOwn(regionConfigs, name)
    ? regionConfigs[name]
    : throwConfigurationError("regionConfiguration", skill);
  const variant = pickVariant(config, profile);
  return Object.keys(variant).length > 0
    ? variant
    : throwConfigurationError("regionConfiguration", skill);
};

/** Keys ascend, so a tie between two keys goes to the smaller one. */
const findNearestKey = (keys: readonly number[], minutes: number): number =>
  keys.reduce((nearest, key) =>
    Math.abs(key - minutes) < Math.abs(nearest - minutes) ? key : nearest,
  );

/**
 * Selects the region configuration of spec section 5, rule 1. The skill reads
 * its configuration variant, and the minutes pick the nearest key, the smaller
 * one on a tie. The selection leaves the skill's minutes unchanged. A skill
 * without a configuration raises the configuration error OTHER/OTHER.
 *
 * selectRegionConfiguration("SWR1", 60, advancedAdult, regionConfigs)
 * → { tagEntries: [{ tags: ["REGION_UPPER_BODY"], count: 4 },
 *     { tags: ["REGION_LOWER_BODY"], count: 4 }, { tags: ["REGION_CORE"], count: 4 }] }
 */
export const selectRegionConfiguration = (
  skill: SkillCode,
  minutes: number,
  profile: DerivedProfile,
  regionConfigs: PlanAuthoredData["regionConfigs"],
): RegionConfiguration => {
  const variant = readRegionConfigurationVariant(skill, profile, regionConfigs);
  const keys = Object.keys(variant)
    .map(Number)
    .sort((a, b) => a - b);
  // The lookup uses the nearest key at or below the largest one, and the skill
  // keeps its minutes: src/features/training/generators/PlanGenerator.ts,
  // PlanGenerator.createSection
  return { tagEntries: variant[String(findNearestKey(keys, minutes))] };
};

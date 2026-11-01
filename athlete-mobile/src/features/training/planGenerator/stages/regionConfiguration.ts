import { WorkoutConstants } from "@/constants/workoutConstants";
import type { PlanAuthoredData } from "@/data/loadPlanAuthoredData";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type {
  DurationTagMap,
  RegionConfig,
  RegionTagEntry,
} from "@/schemas/generator.schema";
import type { DerivedProfile } from "./profileDerivation";

/** The tag entries branch selection fills. */
export interface RegionConfiguration {
  readonly tagEntries: readonly RegionTagEntry[];
}

const { AGE_GROUPS, LEVELS } = WorkoutConstants;

// Every cardio skill and both max strength skills share one configuration.
const readRegionConfigurationName = (skill: string): string => {
  if (skill.startsWith("CARDIO")) return "CARDIO";
  if (skill === "MAX_STRENGTH") return "MAX";
  return skill;
};

const throwMissingRegionConfiguration = (skill: string): never => {
  throw {
    type: "OTHER",
    subtype: "OTHER",
    params: ["regionConfiguration", skill],
  } satisfies GeneratorError;
};

const pickVariant = (
  config: RegionConfig,
  { ageGroup, fitnessLevel }: DerivedProfile,
): DurationTagMap => {
  if (ageGroup === AGE_GROUPS.CHILD && config.child) return config.child;
  if (fitnessLevel === LEVELS.PROFESSIONAL && config.professional) {
    return config.professional;
  }
  return config.default;
};

// Keys ascend, so a tie between two keys goes to the smaller one.
const findNearestKey = (keys: readonly number[], minutes: number): number =>
  keys.reduce((nearest, key) =>
    Math.abs(key - minutes) < Math.abs(nearest - minutes) ? key : nearest,
  );

/**
 * Selects the region configuration of spec section 5, rule 1. The skill reads
 * its authored configuration: the child variant for a child, the professional
 * variant for a professional, otherwise the default. The minutes pick the
 * nearest key, the smaller one on a tie. The selection leaves the skill's
 * minutes unchanged. A skill without a configuration raises the configuration
 * error OTHER/OTHER.
 *
 * selectRegionConfiguration("SWR1", 60, advancedAdult, regionConfigs)
 * → { tagEntries: [{ tags: ["REGION_UPPER_BODY"], count: 4 },
 *     { tags: ["REGION_LOWER_BODY"], count: 4 }, { tags: ["REGION_CORE"], count: 4 }] }
 */
export const selectRegionConfiguration = (
  skill: string,
  minutes: number,
  profile: DerivedProfile,
  regionConfigs: PlanAuthoredData["regionConfigs"],
): RegionConfiguration => {
  const name = readRegionConfigurationName(skill);
  const config = Object.hasOwn(regionConfigs, name)
    ? regionConfigs[name]
    : throwMissingRegionConfiguration(skill);
  const variant = pickVariant(config, profile);
  const keys = Object.keys(variant)
    .map(Number)
    .sort((a, b) => a - b);
  if (keys.length === 0) return throwMissingRegionConfiguration(skill);
  // The lookup uses the nearest key at or below the largest one, and the skill
  // keeps its minutes: src/features/training/generators/PlanGenerator.ts#L576-L590
  return { tagEntries: variant[String(findNearestKey(keys, minutes))] };
};

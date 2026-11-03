import { CardioTypesSchema } from "@/schemas/common.schema";
import type { SkillCode } from "@/schemas/generator.schema";

/** The warm-up for the regions of the day's prevention skills. */
export const SPECIAL_WARM_UP = "WUSPEZIAL";

/** Both max strength skills, which share one skill tree and region configuration. */
export const MAX_STRENGTH_SKILLS: readonly SkillCode[] = ["MAX", "MAX_STRENGTH"];

/** The hypertrophy, max strength, explosive power and power endurance skills. */
export const STRENGTH_SKILLS: readonly SkillCode[] = [
  "SWR1",
  "SWR2",
  "SWR1KG",
  "SWR2KG",
  ...MAX_STRENGTH_SKILLS,
  "SK",
  "SKKG",
  "SA",
  "SAKG",
];

/**
 * Checks whether a skill is one of the cardio types.
 *
 * isCardioSkill("CARDIO_1_SHORT") → true
 * isCardioSkill("HBCARDIO") → false
 */
export const isCardioSkill = (skill: SkillCode): boolean =>
  CardioTypesSchema.options.some((cardioType) => cardioType === skill);

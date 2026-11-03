import { CardioTypesSchema } from "@/schemas/common.schema";
import type { SkillCode } from "@/schemas/generator.schema";

/**
 * Checks whether a skill is one of the cardio types.
 *
 * isCardioSkill("CARDIO_1_SHORT") → true
 * isCardioSkill("HBCARDIO") → false
 */
export const isCardioSkill = (skill: SkillCode): boolean =>
  CardioTypesSchema.options.some((cardioType) => cardioType === skill);

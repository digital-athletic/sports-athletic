import type { SkillSetListKind } from "@/schemas/aiwl.schema";
import { buildCardioSetList } from "./cardioSetListBuilder";
import { buildMaxStrengthSetList } from "./maxStrengthSetListBuilder";
import type { SkillSetListBuilder } from "./setListBuilder";
import { buildStandardSetList } from "./standardSetListBuilder";

/** Maps each skill set list kind to its set list builder. */
export const SKILL_SET_LIST_BUILDERS: Record<
  SkillSetListKind,
  SkillSetListBuilder
> = {
  cardio: buildCardioSetList,
  maxStrength: buildMaxStrengthSetList,
  standard: buildStandardSetList,
};

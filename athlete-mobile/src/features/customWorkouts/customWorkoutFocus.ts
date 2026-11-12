import { loadSkillCatalogEntry } from "@/data/loadSkillCatalog";
import { type Template } from "@/schemas/aiwl.schema";

export type CustomWorkoutFocus =
  | "strength"
  | "explosive"
  | "cardio"
  | "mobility"
  | "stability"
  | "prevention";

/** Focus of one skill, or null for a warm-up or cool-down skill. */
const readSkillFocus = (skill: string): CustomWorkoutFocus | null => {
  if (skill.startsWith("CARDIO")) return "cardio";
  if (skill.startsWith("WU")) return null;
  if (skill.startsWith("SK") || skill.startsWith("PLYO")) return "explosive";
  switch (loadSkillCatalogEntry(skill)?.focusArea) {
    case "WARMUP":
      return null;
    case "MOBILITY":
      return "mobility";
    case "STABILITY":
      return "stability";
    case "PREVENTION":
      return "prevention";
    default:
      return "strength";
  }
};

/**
 * Rough focus of a custom training: the focus most of its blocks train,
 * without warm-up and cool-down. The earlier focus wins a tie.
 */
export const detectCustomWorkoutFocus = (
  template: Template,
): CustomWorkoutFocus => {
  const blockCounts = new Map<CustomWorkoutFocus, number>();
  for (const block of template.blocks) {
    const focus = readSkillFocus(block.skill);
    if (focus) blockCounts.set(focus, (blockCounts.get(focus) ?? 0) + 1);
  }
  let mainFocus: CustomWorkoutFocus = "strength";
  let mostBlocks = 0;
  for (const [focus, count] of blockCounts) {
    if (count > mostBlocks) {
      mainFocus = focus;
      mostBlocks = count;
    }
  }
  return mainFocus;
};

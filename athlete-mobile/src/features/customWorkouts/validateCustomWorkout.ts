import * as v from "valibot";

import { WorkoutConstants } from "@/constants/workoutConstants";
import { resolveTemplatePlan } from "@/features/training/generators/resolveTemplate";
import {
  TemplateSchema,
  type Block,
  type BlockPicks,
  type PicksBlock,
  type Template,
} from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";

export type CustomWorkoutValidationError =
  | "INVALID_FORMAT"
  | "UNSUPPORTED_CONTENT";
export type CustomWorkoutValidation =
  | { success: true; template: Template }
  | { success: false; error: CustomWorkoutValidationError };

// Windows editors prepend a byte order mark and JSON.parse rejects it.
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

const EQUIPMENT_VARIANTS = [
  { hasWeights: false, equipment: [] },
  { hasWeights: true, equipment: [WorkoutConstants.EQUIPMENT.DUMBBELL] },
];

const parseTemplateText = (text: string): Template | undefined => {
  const json = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return undefined;
  }
  const result = v.safeParse(TemplateSchema, data);
  return result.success ? result.output : undefined;
};

const isSupportedPicksBlock = (block: Block): block is PicksBlock =>
  block.kind === "picks" &&
  block.bodyParts === undefined &&
  block.order === undefined;

const resolvesWithEquipment = (
  template: Template,
  skillTrees: Record<string, SkillTreeType>,
  equipment: string[],
): boolean => {
  try {
    resolveTemplatePlan(template, skillTrees, equipment);
    return true;
  } catch {
    return false;
  }
};

const readPicksForVariant = (
  block: PicksBlock,
  hasWeights: boolean,
): BlockPicks => {
  if (Array.isArray(block.picks)) return block.picks;
  return hasWeights ? block.picks.withWeights : block.picks.withoutWeights;
};

// A single pick without fallback resolves only when its tags match exercises.
const replaceBlockWithSinglePick = (
  template: Template,
  blockIndex: number,
  block: PicksBlock,
  pick: BlockPicks[number],
): Template => ({
  ...template,
  blocks: template.blocks.map((original, index) =>
    index === blockIndex
      ? { ...block, picks: [pick], fallbackToWholeTree: false }
      : original,
  ),
});

const checkTagPicksOfBlock = (
  template: Template,
  blockIndex: number,
  block: PicksBlock,
  skillTrees: Record<string, SkillTreeType>,
): boolean =>
  EQUIPMENT_VARIANTS.every(({ hasWeights, equipment }) =>
    readPicksForVariant(block, hasWeights).every((pick) =>
      resolvesWithEquipment(
        replaceBlockWithSinglePick(template, blockIndex, block, pick),
        skillTrees,
        equipment,
      ),
    ),
  );

/** True when the generator can resolve every block and every tag pick with and without weights. */
export const isTemplateRunnable = (
  template: Template,
  skillTrees: Record<string, SkillTreeType>,
): boolean => {
  const blocks = template.blocks;
  if (!blocks.every(isSupportedPicksBlock)) return false;
  const resolvesEveryVariant = EQUIPMENT_VARIANTS.every(({ equipment }) =>
    resolvesWithEquipment(template, skillTrees, equipment),
  );
  return (
    resolvesEveryVariant &&
    blocks.every((block, index) =>
      checkTagPicksOfBlock(template, index, block, skillTrees),
    )
  );
};

/** Strips a UTF-8 BOM, parses JSON, checks TemplateSchema, then runnability. */
export const validateCustomWorkoutText = (
  text: string,
  skillTrees: Record<string, SkillTreeType>,
): CustomWorkoutValidation => {
  const template = parseTemplateText(text);
  if (!template) return { success: false, error: "INVALID_FORMAT" };
  if (!isTemplateRunnable(template, skillTrees)) {
    return { success: false, error: "UNSUPPORTED_CONTENT" };
  }
  return { success: true, template };
};

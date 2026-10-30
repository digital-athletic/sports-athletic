import * as v from "valibot";

import { WorkoutConstants } from "@/constants/workoutConstants";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { resolvePicksBlocks } from "@/features/training/workoutGenerator/blockHandlers/picks/picksBlockResolution";
import { readSkillSetListKind } from "@/features/training/workoutGenerator/stages/setListBuilding";
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

// Import only caps: bundled templates reach count 10, rest 45, 2 blocks, 2 picks
// entries, 4 tags and 35 name characters; the skill catalog reaches sets 2, rest 180.
export const MAX_CUSTOM_WORKOUT_PICK_COUNT = 50;
export const MAX_CUSTOM_WORKOUT_SETS = 10;
export const MAX_CUSTOM_WORKOUT_SET_DURATION_SECONDS = 600;
export const MAX_CUSTOM_WORKOUT_DURATION_SECONDS = 7200;
export const MAX_CUSTOM_WORKOUT_REST_SECONDS = 900;
export const MAX_CUSTOM_WORKOUT_BLOCKS = 20;
export const MAX_CUSTOM_WORKOUT_PICKS_PER_BLOCK = 20;
export const MAX_CUSTOM_WORKOUT_TAGS_PER_PICK = 20;
export const MAX_CUSTOM_WORKOUT_NAME_LENGTH = 100;
export const MAX_CUSTOM_WORKOUT_NAME_LANGUAGES = 20;

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

const isAtMost = (value: number | undefined, limit: number): boolean =>
  value === undefined || value <= limit;

const isPicksListWithinLimits = (picks: BlockPicks): boolean =>
  picks.length <= MAX_CUSTOM_WORKOUT_PICKS_PER_BLOCK &&
  picks.every(
    (pick) =>
      pick.count <= MAX_CUSTOM_WORKOUT_PICK_COUNT &&
      pick.tags.length <= MAX_CUSTOM_WORKOUT_TAGS_PER_PICK,
  );

const isBlockWithinLimits = (block: Block): boolean => {
  const restValues = Object.values(block.rest ?? {});
  const picksLists =
    block.kind !== "picks"
      ? []
      : Array.isArray(block.picks)
        ? [block.picks]
        : [block.picks.withWeights, block.picks.withoutWeights];
  return (
    isAtMost(block.sets, MAX_CUSTOM_WORKOUT_SETS) &&
    isAtMost(block.setDuration, MAX_CUSTOM_WORKOUT_SET_DURATION_SECONDS) &&
    isAtMost(
      block.kind === "picks" ? undefined : block.duration,
      MAX_CUSTOM_WORKOUT_DURATION_SECONDS,
    ) &&
    restValues.every((rest) =>
      isAtMost(rest, MAX_CUSTOM_WORKOUT_REST_SECONDS),
    ) &&
    picksLists.every(isPicksListWithinLimits)
  );
};

// Huge values such as sets 1000000000 make the generator loop for minutes.
const isTemplateWithinImportLimits = (template: Template): boolean => {
  const names = Object.values(template.name);
  return (
    names.length <= MAX_CUSTOM_WORKOUT_NAME_LANGUAGES &&
    names.every((name) => name.length <= MAX_CUSTOM_WORKOUT_NAME_LENGTH) &&
    template.blocks.length <= MAX_CUSTOM_WORKOUT_BLOCKS &&
    template.blocks.every(isBlockWithinLimits)
  );
};

const isSupportedPicksBlock = (block: Block): block is PicksBlock =>
  block.kind === "picks" &&
  block.bodyParts === undefined &&
  block.order === undefined;

// Resolves the pools the AIWL generator draws from, so an import passes only
// what the generator runs.
const resolvesWithEquipment = (
  template: Template,
  skillTrees: Record<string, SkillTreeType>,
  equipment: string[],
): boolean => {
  try {
    resolvePicksBlocks(
      template,
      { equipment, skillCatalog: loadSkillCatalog() },
      skillTrees,
    );
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

// A cardio zone tree holds the same branches at every training place.
const isRunnableCardioBlock = (
  block: Block,
  skillTrees: Record<string, SkillTreeType>,
): boolean =>
  block.kind === "duration" &&
  readSkillSetListKind(block.skill) === "cardio" &&
  block.bodyParts === undefined &&
  block.order === undefined &&
  Object.hasOwn(skillTrees, block.skill) &&
  Object.keys(skillTrees[block.skill]).length > 0;

/**
 * True when the generator can run every block: each cardio duration block
 * draws from a tree with branches, and every picks block and tag pick resolves
 * with and without weights.
 */
export const isTemplateRunnable = (
  template: Template,
  skillTrees: Record<string, SkillTreeType>,
): boolean => {
  if (
    !template.blocks.every(
      (block) =>
        isSupportedPicksBlock(block) ||
        isRunnableCardioBlock(block, skillTrees),
    )
  ) {
    return false;
  }
  const picksTemplate = {
    ...template,
    blocks: template.blocks.filter(isSupportedPicksBlock),
  };
  if (picksTemplate.blocks.length === 0) return true;
  const resolvesEveryVariant = EQUIPMENT_VARIANTS.every(({ equipment }) =>
    resolvesWithEquipment(picksTemplate, skillTrees, equipment),
  );
  return (
    resolvesEveryVariant &&
    picksTemplate.blocks.every((block, index) =>
      checkTagPicksOfBlock(picksTemplate, index, block, skillTrees),
    )
  );
};

/** Strips a UTF-8 BOM, parses JSON, checks TemplateSchema, import limits, then runnability. */
export const validateCustomWorkoutText = (
  text: string,
  skillTrees: Record<string, SkillTreeType>,
): CustomWorkoutValidation => {
  const template = parseTemplateText(text);
  if (!template) return { success: false, error: "INVALID_FORMAT" };
  if (
    !isTemplateWithinImportLimits(template) ||
    !isTemplateRunnable(template, skillTrees)
  ) {
    return { success: false, error: "UNSUPPORTED_CONTENT" };
  }
  return { success: true, template };
};

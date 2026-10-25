import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { createBranchesBlockHandler } from "./blockHandlers/branches/branchesHandler";
import { lookUpStoredBranchInCatalog } from "./blockHandlers/branches/storedBranchLookup";
import { restrictTemplateBranchesBlock } from "./blockHandlers/branches/templateBranchRestriction";
import { PICKS_BLOCK_HANDLER } from "./blockHandlers/picks/picksHandler";
import type { GenerationInput } from "./generationInput/generationInput";
import type { BlockHandlerRegistry } from "./stages/blockWalk";
import {
  createSetListBuilder,
  SHORT_WORKOUT_SET_LIST_RULES,
} from "./stages/setListBuilding";
import { requireSupportedTemplateBlocks } from "./stages/templateBlockCheck";
import { SHORT_WORKOUT_FINISH_RULES } from "./stages/workoutFinish";
import { interpretTemplate } from "./templateInterpreter";

const throwUnreachableShortWorkoutBlock = (): never => {
  throw new Error("A short workout runs picks and branches blocks only");
};

const CATALOG_BRANCHES_HANDLER = createBranchesBlockHandler(
  lookUpStoredBranchInCatalog,
);

// requireSupportedTemplateBlocks rejects duration blocks first, so that
// handler never runs.
const SHORT_WORKOUT_HANDLERS: BlockHandlerRegistry = {
  picks: PICKS_BLOCK_HANDLER,
  branches: {
    usedBranchScope: CATALOG_BRANCHES_HANDLER.usedBranchScope,
    handleBlock: (block, input, usedBranches, earlierResults) =>
      CATALOG_BRANCHES_HANDLER.handleBlock(
        restrictTemplateBranchesBlock(block, input),
        input,
        usedBranches,
        earlierResults,
      ),
  },
  duration: {
    usedBranchScope: "workout",
    handleBlock: throwUnreachableShortWorkoutBlock,
  },
};

/**
 * Generates a short workout from its template. A template without blocks
 * throws the pain error of an empty pool, whatever the athlete's pains. A
 * duration block, an `order` field or picks `bodyParts` throws
 * OTHER/BLOCK_KIND before any picks workout rule runs. Picks and branches
 * blocks then run in template order, and an empty block adds nothing.
 *
 * generateShortWorkoutFromTemplate(mobilityTemplate, input, getAllSkillTrees())
 * → [{ branchId: "2", exerciseId: "21", skill: "MOB", ... }, ...]
 */
export const generateShortWorkoutFromTemplate = (
  template: Template,
  input: GenerationInput,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): GeneratedSetListEntry[] => {
  if (template.blocks.length === 0) {
    throw {
      type: "NO_EXERCISES",
      subtype: "PAIN",
      params: [],
    } satisfies GeneratorError;
  }
  requireSupportedTemplateBlocks(template);
  return interpretTemplate(template, input, {
    handlers: SHORT_WORKOUT_HANDLERS,
    finishRules: SHORT_WORKOUT_FINISH_RULES,
    createSetListBuilder: (workoutInput) =>
      createSetListBuilder(workoutInput, SHORT_WORKOUT_SET_LIST_RULES),
    skillTrees,
  }).setList;
};

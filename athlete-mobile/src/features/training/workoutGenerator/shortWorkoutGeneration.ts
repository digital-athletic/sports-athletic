import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { BlockHandlerRegistry } from "./blockWalk";
import type { GenerationInput } from "./generationInput";
import { PICKS_BLOCK_HANDLER } from "./picksHandler";
import { requirePicksBlock } from "./picksBlockResolution";
import { createShortWorkoutSetListBuilder } from "./setListBuilding";
import { interpretTemplate } from "./templateInterpreter";
import { SHORT_WORKOUT_FINISH_RULES } from "./workoutFinish";

const throwUnreachableShortWorkoutBlock = (): never => {
  throw new Error("A short workout runs picks blocks only");
};

// requirePicksBlock rejects every other kind first, so these never run.
const SHORT_WORKOUT_HANDLERS: BlockHandlerRegistry = {
  picks: PICKS_BLOCK_HANDLER,
  branches: {
    usedBranchScope: "block",
    handleBlock: throwUnreachableShortWorkoutBlock,
  },
  duration: {
    usedBranchScope: "workout",
    handleBlock: throwUnreachableShortWorkoutBlock,
  },
};

/**
 * Generates a short workout from its template. A template without blocks
 * throws the pain error of an empty pool, whatever the athlete's pains. A
 * block that is not a plain picks block throws OTHER/BLOCK_KIND before any
 * picks workout rule runs. Picks blocks then draw in template order, and an
 * empty block adds nothing to the set list.
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
  template.blocks.forEach((block, index) =>
    requirePicksBlock(template.id, index, block),
  );
  return interpretTemplate(template, input, {
    handlers: SHORT_WORKOUT_HANDLERS,
    finishRules: SHORT_WORKOUT_FINISH_RULES,
    createSetListBuilder: createShortWorkoutSetListBuilder,
    skillTrees,
  }).setList;
};

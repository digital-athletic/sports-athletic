import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block, Template } from "@/schemas/aiwl.schema";
import { readSkillSetListKind } from "./setListBuilding";

// Names the kind or field of a block the generator cannot run yet. A duration
// block runs only for a skill whose set list builder fills a length: cardio.
const findUnsupportedBlockPart = (block: Block): string | undefined => {
  if (
    block.kind === "duration" &&
    readSkillSetListKind(block.skill) !== "cardio"
  ) {
    return block.kind;
  }
  if (block.kind !== "branches" && block.bodyParts !== undefined) {
    return "bodyParts";
  }
  if (block.order !== undefined) return "order";
  return undefined;
};

/**
 * Rejects a template block a short workout cannot run: a duration block of a
 * skill other than a cardio zone, an `order` field, or `bodyParts` on a picks
 * or duration block. The first offending block in template order throws
 * OTHER/BLOCK_KIND.
 *
 * requireSupportedTemplateBlocks(durationTemplate)
 * → throws { type: "OTHER", subtype: "BLOCK_KIND", params: ["short.blocks[1]", "duration"] }
 */
export const requireSupportedTemplateBlocks = (template: Template): void => {
  template.blocks.forEach((block, index) => {
    const unsupported = findUnsupportedBlockPart(block);
    if (unsupported !== undefined) {
      throw {
        type: "OTHER",
        subtype: "BLOCK_KIND",
        params: [`${template.id}.blocks[${index}]`, unsupported],
      } satisfies GeneratorError;
    }
  });
};

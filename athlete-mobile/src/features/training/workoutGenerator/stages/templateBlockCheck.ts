import type { GeneratorError } from "@/features/training/models/GeneratorError";
import {
  type Block,
  readSkillSetListKind,
  type Template,
} from "@/schemas/aiwl.schema";

// Names the kind or field of a block the generator cannot run yet. A duration
// block runs only for a skill whose set list builder fills a length: cardio.
const findUnsupportedBlockPart = (block: Block): string | undefined => {
  if (block.kind === "exercises") return block.kind;
  if (
    block.kind === "duration" &&
    readSkillSetListKind(block.skill) !== "cardio"
  ) {
    return block.kind;
  }
  if (block.kind !== "branches" && block.bodyParts !== undefined) {
    return "bodyParts";
  }
  return undefined;
};

/**
 * Rejects a template block a short workout cannot run: an exercises block, a
 * duration block of a skill other than a cardio zone, or `bodyParts` on a
 * picks or duration block. The first offending block in template order throws
 * OTHER/BLOCK_KIND. An `order` field passes; set list building ignores it.
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

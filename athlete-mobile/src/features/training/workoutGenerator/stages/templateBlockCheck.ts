import type { GeneratorError } from "@/features/training/models/GeneratorError";
import { type Block, readSkillSetListKind } from "@/schemas/aiwl.schema";
import type { InterpretedWorkout } from "./blockWalk";

// Names the kind or field of a block the generator cannot run yet. A duration
// block runs only for a skill whose set list builder fills a length: cardio.
// An exercises block runs only as the lifts of a strength test.
const findUnsupportedBlockPart = (block: Block): string | undefined => {
  if (block.kind === "exercises") {
    return block.testSets === undefined ? block.kind : undefined;
  }
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
 * Rejects a workout block the generator cannot run: an exercises block without
 * test sets, a duration block of a skill other than a cardio zone, or
 * `bodyParts` on a picks or duration block. The first offending block in
 * workout order throws OTHER/BLOCK_KIND. An `order` field passes; set list
 * building ignores it.
 *
 * requireSupportedTemplateBlocks(durationTemplate)
 * → throws { type: "OTHER", subtype: "BLOCK_KIND", params: ["short.blocks[1]", "duration"] }
 */
export const requireSupportedTemplateBlocks = (
  workout: InterpretedWorkout,
): void => {
  workout.blocks.forEach((block, index) => {
    const unsupported = findUnsupportedBlockPart(block);
    if (unsupported !== undefined) {
      throw {
        type: "OTHER",
        subtype: "BLOCK_KIND",
        params: [`${workout.id}.blocks[${index}]`, unsupported],
      } satisfies GeneratorError;
    }
  });
};

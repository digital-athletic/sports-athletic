import type { BranchesBlock, InterpretedWorkout } from "./stages/blockWalk";
import type { Block } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import {
  isPicksBlock,
  resolvePicksBlocks,
} from "./blockHandlers/picks/picksBlockResolution";
import type { GenerationInput } from "./generationInput/generationInput";

/** A saved block and the index of the template block it was drawn from. */
export type SavedBlock = { block: BranchesBlock; templateIndex?: number };

/**
 * Rebuilds the pool each saved block draws a replacement from: the pool of
 * the picks block at its template index, keyed by the saved block. A saved
 * block without a template index, such as a cardio block, has no pool.
 * Throws like resolvePicksBlocks, for example when a pool is empty, and
 * throws when a template index matches no picks block.
 *
 * readReplacementPools(template, [{ block: kneeBlock, templateIndex: 1 }], input, skillTrees)
 * → Map { kneeBlock => { ...pool of template.blocks[1] } }
 */
export const readReplacementPools = (
  template: InterpretedWorkout,
  saved: readonly SavedBlock[],
  input: Pick<GenerationInput, "equipment" | "skillCatalog">,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): ReadonlyMap<Block, SkillTreeType> => {
  const resolvedBlocks = resolvePicksBlocks(template, input, skillTrees).blocks;
  // resolvePicksBlocks returns the picks blocks only, in template order
  const picksTemplateIndices = template.blocks.flatMap((block, index) =>
    isPicksBlock(block) ? [index] : [],
  );
  const pools = new Map<Block, SkillTreeType>();
  for (const { block, templateIndex } of saved) {
    if (templateIndex === undefined) continue;
    const resolved =
      resolvedBlocks[picksTemplateIndices.indexOf(templateIndex)];
    if (!resolved) {
      throw new Error(
        `Template index ${templateIndex} matches no picks block of the template`,
      );
    }
    pools.set(block, resolved.pool);
  }
  return pools;
};

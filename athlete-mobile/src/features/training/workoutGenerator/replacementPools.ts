import type { Block } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { resolvePicksBlocks } from "./blockHandlers/picks/picksBlockResolution";
import type { GenerationInput } from "./generationInput/generationInput";
import type { InterpretedWorkout } from "./stages/blockWalk";

/**
 * Reads the replacement pool of each branches block with `pickedFrom`: the
 * pool a picks block of the same skill with those picks would draw from, for
 * the athlete's equipment. A block without `pickedFrom` has no pool. Throws
 * like resolvePicksBlocks, for example when a pool is empty.
 *
 * readReplacementPools({ blocks: [kneeBlock with pickedFrom] }, input, skillTrees)
 * → Map { kneeBlock => { "518": ..., "523": ..., ... } }
 */
export const readReplacementPools = (
  workout: InterpretedWorkout,
  input: Pick<GenerationInput, "equipment" | "skillCatalog">,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): ReadonlyMap<Block, SkillTreeType> => {
  const replacing: Block[] = workout.blocks.filter(
    (block) => block.kind === "branches" && block.pickedFrom !== undefined,
  );
  if (replacing.length === 0) return new Map();
  // The other blocks stay in, because their prevention skills narrow the pools.
  const asPicks = {
    id: workout.id,
    blocks: workout.blocks.map((block) =>
      block.kind === "branches" && block.pickedFrom
        ? { kind: "picks" as const, skill: block.skill, ...block.pickedFrom }
        : block,
    ),
  };
  const resolved = resolvePicksBlocks(asPicks, input, skillTrees).blocks;
  // resolvePicksBlocks returns the picks blocks only, in workout order, and a
  // workout can mix picks blocks with replacing branches blocks.
  const picksOrigins = workout.blocks.filter(
    (block) => block.kind === "picks" || replacing.includes(block),
  );
  return new Map(
    replacing.map((block) => [
      block,
      resolved[picksOrigins.indexOf(block)].pool,
    ]),
  );
};

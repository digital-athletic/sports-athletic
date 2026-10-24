import { TagGroups } from "@/constants/tagGroups";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import { readLiteralSkillTree } from "@/features/training/utils/skillTreeUtils";
import type {
  Block,
  BlockPicks,
  CountBy,
  PicksBlock,
  Template,
} from "@/schemas/aiwl.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import {
  hasSkillTree,
  type SkillCatalog,
  type SkillTreeCatalogEntry,
} from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getTagValues } from "@/utils/tagUtils";
import {
  createBlockDefaultCheck,
  type ResolvedBlockTiming,
  resolveBlockTiming,
} from "./blockTiming";
import { filterBranchesByTags } from "./branchTagFilter";
import type { GenerationInput } from "./generationInput";
import { readSkillCatalogEntry } from "./skillCatalogEntry";

/** A picks block with its defaults, its place picks and its branch pool. */
export interface ResolvedPicksBlock extends ResolvedBlockTiming {
  readonly skill: SkillCode;
  readonly pool: SkillTreeType;
  readonly picks: BlockPicks;
  readonly countBy: CountBy;
  readonly fallbackToWholeTree: boolean;
}

/** The resolved picks blocks of a template and the union of their pools. */
export interface ResolvedPicksBlocks {
  readonly pool: SkillTreeType;
  readonly blocks: ResolvedPicksBlock[];
}

interface PicksPoolSource {
  readonly skillCatalog: SkillCatalog;
  readonly skillTrees: Readonly<Record<string, SkillTreeType>>;
  readonly hasWeights: boolean;
  readonly preventionRegions: string[];
}

const SPECIAL_WARM_UP_TREE = "WUSPEZIAL";

const createSkillTreeError = (skill: string): GeneratorError => ({
  type: "NO_EXERCISES",
  subtype: "SKILL_TREE",
  params: [skill],
});

const requirePicksBlock = (
  templateId: string,
  index: number,
  block: Block,
): PicksBlock => {
  const reject = (what: string): GeneratorError => ({
    type: "OTHER",
    subtype: "BLOCK_KIND",
    params: [`${templateId}.blocks[${index}]`, what],
  });
  if (block.kind !== "picks") throw reject(block.kind);
  if (block.bodyParts !== undefined) throw reject("bodyParts");
  if (block.order !== undefined) throw reject("order");
  return block;
};

// The special warm-up prepares the pain regions of the template's prevention
// blocks, so it narrows to the branches tagged with one of them. The match
// runs before branches without levels drop, so a match without levels leaves
// nothing instead of the whole tree.
const readSpecialWarmUpTree = ({
  skillTrees,
  preventionRegions,
}: PicksPoolSource): SkillTreeType => {
  const tree = readLiteralSkillTree(skillTrees, SPECIAL_WARM_UP_TREE);
  const authored = Object.hasOwn(skillTrees, SPECIAL_WARM_UP_TREE)
    ? skillTrees[SPECIAL_WARM_UP_TREE]
    : {};
  const matchingIds = Object.keys(authored).filter((id) =>
    getTagValues(authored[id].tags, TagGroups.PAIN).some((region) =>
      preventionRegions.includes(region),
    ),
  );
  if (matchingIds.length === 0) return tree;
  return Object.fromEntries(
    Object.entries(tree).filter(([id]) => matchingIds.includes(id)),
  );
};

const readPlacePicks = (
  block: PicksBlock,
  withWeights: boolean,
): BlockPicks => {
  if (Array.isArray(block.picks)) return block.picks;
  return withWeights ? block.picks.withWeights : block.picks.withoutWeights;
};

const buildBlockPool = (
  entry: SkillTreeCatalogEntry,
  picks: BlockPicks,
  fallbackToWholeTree: boolean,
  source: PicksPoolSource,
): SkillTreeType => {
  const names = source.hasWeights
    ? entry.skillTree.withWeights
    : entry.skillTree.withoutWeights;
  const union: SkillTreeType = {};
  for (const name of names) {
    Object.assign(
      union,
      name === SPECIAL_WARM_UP_TREE
        ? readSpecialWarmUpTree(source)
        : readLiteralSkillTree(source.skillTrees, name),
    );
  }
  if (fallbackToWholeTree) return union;
  const matchingIds = new Set(
    picks.flatMap(({ tags }) => Object.keys(filterBranchesByTags(union, tags))),
  );
  return Object.fromEntries(
    Object.entries(union).filter(([id]) => matchingIds.has(id)),
  );
};

const resolvePicksBlock = (
  block: PicksBlock,
  path: string,
  source: PicksPoolSource,
): ResolvedPicksBlock => {
  const entry = readSkillCatalogEntry(source.skillCatalog, block.skill);
  if (!entry || !hasSkillTree(entry)) throw createSkillTreeError(block.skill);
  const timing = resolveBlockTiming(block, entry, path);
  const requireValue = createBlockDefaultCheck(block.skill, path);
  const countBy = requireValue("countBy", block.countBy, entry.countBy);
  const fallbackToWholeTree = requireValue(
    "fallbackToWholeTree",
    block.fallbackToWholeTree,
    entry.fallbackToWholeTree,
  );
  const picks = readPlacePicks(block, source.hasWeights);
  const pool = buildBlockPool(entry, picks, fallbackToWholeTree, source);
  if (Object.keys(pool).length === 0) throw createSkillTreeError(block.skill);
  return {
    ...timing,
    skill: block.skill,
    pool,
    picks,
    countBy,
    fallbackToWholeTree,
  };
};

/**
 * Resolves every block of a short workout template before any rule or draw:
 * the defaults from the skill catalog of the input, the picks of the place
 * and the pool from the skill trees of the catalog entry. Throws plain
 * GeneratorError objects: OTHER/BLOCK_KIND for a block that is not a plain
 * picks block, NO_EXERCISES/SKILL_TREE for a skill without a tree or an empty
 * pool, and an Error with the block path for a missing default.
 *
 * resolvePicksBlocks(prevKneeTemplate, input, getAllSkillTrees())
 * → { pool: { ...special warm-up and PREVKNEE branches },
 *     blocks: [{ skill: "WUSPEZIAL", countBy: "entries", ... }, { skill: "PREVKNEE", countBy: "pairs", ... }] }
 */
export const resolvePicksBlocks = (
  template: Template,
  input: Pick<GenerationInput, "equipment" | "skillCatalog">,
  skillTrees: Readonly<Record<string, SkillTreeType>>,
): ResolvedPicksBlocks => {
  const picksBlocks = template.blocks.map((block, index) =>
    requirePicksBlock(template.id, index, block),
  );
  const preventionRegions = picksBlocks
    .map(({ skill }) => readSkillCatalogEntry(input.skillCatalog, skill))
    .filter((entry) => entry?.focusArea === "PREVENTION")
    .flatMap((entry) => entry?.painRegions ?? []);
  const source: PicksPoolSource = {
    skillCatalog: input.skillCatalog,
    skillTrees,
    hasWeights: hasWeights(input.equipment),
    preventionRegions,
  };
  const blocks = picksBlocks.map((block, index) =>
    resolvePicksBlock(block, `${template.id}.blocks[${index}]`, source),
  );
  return {
    pool: blocks.reduce<SkillTreeType>(
      (pool, block) => ({ ...pool, ...block.pool }),
      {},
    ),
    blocks,
  };
};

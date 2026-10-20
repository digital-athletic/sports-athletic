import { loadSkillCatalogEntry } from "@/data/loadSkillCatalog";
import { loadTemplate } from "@/data/loadTemplates";
import type { TrainingType } from "@/features/training/models/Training";
import { hasWeights as hasWeightEquipment } from "@/features/training/utils/equipmentUtils";
import {
  getSkillTree,
  readLiteralSkillTree,
} from "@/features/training/utils/skillTreeUtils";
import type {
  Block,
  BlockPicks,
  BlockValues,
  CountBy,
  PicksBlock,
  Rest,
  Superset,
} from "@/schemas/aiwl.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { SkillCatalogEntry } from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { GeneratorError } from "./GeneratorError";
import { filterByTags } from "./focusTrainingSelection";

export interface BlockTiming {
  setDuration?: number;
  afterBlock?: number;
  values?: BlockValues;
  rest: Rest;
}

export interface ResolvedBlock extends BlockTiming {
  skill: SkillCode;
  pool: SkillTreeType;
  picks: BlockPicks;
  countBy: CountBy;
  fallbackToWholeTree: boolean;
  sets: number;
  superset: Superset;
}

export interface ShortWorkoutPlan {
  pool: SkillTreeType;
  blocks: ResolvedBlock[];
}

// Only WUSPEZIAL narrows to the prevention pain regions: it is the special
// warm up that prepares the pain regions of the prevention blocks.
const readBlockSkillTree = (
  skillTrees: Record<string, SkillTreeType>,
  name: string,
  preventionSkills: string[],
  hasWeights: boolean,
): SkillTreeType =>
  name === "WUSPEZIAL"
    ? getSkillTree(skillTrees, name, preventionSkills, hasWeights)
    : readLiteralSkillTree(skillTrees, name);

const supportedBlock = (
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

const skillError = (skill: string): GeneratorError => ({
  type: "NO_EXERCISES",
  subtype: "SKILL_TREE",
  params: [skill],
});

type BlockContext = {
  skillTrees: Record<string, SkillTreeType>;
  hasWeights: boolean;
  preventionSkills: string[];
};

type BlockDefaults = Pick<
  ResolvedBlock,
  "rest" | "countBy" | "fallbackToWholeTree" | "sets" | "superset"
>;

const defaultsOf = (
  path: string,
  block: PicksBlock,
  entry: SkillCatalogEntry,
): BlockDefaults => {
  const withDefault = <T>(field: string, own?: T, base?: T): T => {
    const value = own ?? base;
    if (value === undefined) {
      throw new Error(`${path}.${field}: skill ${block.skill} sets no default`);
    }
    return value;
  };
  return {
    rest: {
      withinSuperset: withDefault(
        "rest.withinSuperset",
        block.rest?.withinSuperset,
        entry.rest?.withinSuperset,
      ),
      betweenSets: withDefault(
        "rest.betweenSets",
        block.rest?.betweenSets,
        entry.rest?.betweenSets,
      ),
      afterExercise: withDefault(
        "rest.afterExercise",
        block.rest?.afterExercise,
        entry.rest?.afterExercise,
      ),
    },
    countBy: withDefault("countBy", block.countBy, entry.countBy),
    fallbackToWholeTree: withDefault(
      "fallbackToWholeTree",
      block.fallbackToWholeTree,
      entry.fallbackToWholeTree,
    ),
    sets: withDefault("sets", block.sets, entry.sets),
    superset: withDefault("superset", block.superset, entry.superset),
  };
};

const picksFor = (block: PicksBlock, hasWeights: boolean): BlockPicks => {
  if (Array.isArray(block.picks)) return block.picks;
  return hasWeights ? block.picks.withWeights : block.picks.withoutWeights;
};

const poolFor = (
  entry: SkillCatalogEntry,
  picks: BlockPicks,
  fallbackToWholeTree: boolean,
  { skillTrees, hasWeights, preventionSkills }: BlockContext,
): SkillTreeType => {
  const names = hasWeights
    ? entry.skillTree.withWeights
    : entry.skillTree.withoutWeights;
  const union: SkillTreeType = {};
  for (const name of names) {
    Object.assign(
      union,
      readBlockSkillTree(skillTrees, name, preventionSkills, hasWeights),
    );
  }
  if (fallbackToWholeTree) return union;
  const matching = new Set(
    picks.flatMap(({ tags }) => Object.keys(filterByTags(union, tags))),
  );
  return Object.fromEntries(
    Object.entries(union).filter(([id]) => matching.has(id)),
  );
};

const resolveBlock = (
  templateId: string,
  index: number,
  block: PicksBlock,
  context: BlockContext,
): ResolvedBlock => {
  const entry = loadSkillCatalogEntry(block.skill);
  if (!entry) throw skillError(block.skill);

  const defaults = defaultsOf(`${templateId}.blocks[${index}]`, block, entry);
  const picks = picksFor(block, context.hasWeights);
  const pool = poolFor(entry, picks, defaults.fallbackToWholeTree, context);
  if (Object.keys(pool).length === 0) throw skillError(block.skill);
  return {
    skill: block.skill,
    pool,
    picks,
    setDuration: block.setDuration,
    afterBlock: block.rest?.afterBlock,
    values: block.values,
    ...defaults,
  };
};

export const resolveShortWorkoutPlan = (
  type: TrainingType,
  skillTrees: Record<string, SkillTreeType>,
  equipment: string[],
): ShortWorkoutPlan => {
  const template = loadTemplate(type);
  if (!template) throw skillError(type);

  const picksBlocks = template.blocks.map((block, index) =>
    supportedBlock(type, index, block),
  );
  const preventionSkills = picksBlocks
    .map((block) => block.skill)
    .filter(
      (skill) => loadSkillCatalogEntry(skill)?.focusArea === "PREVENTION",
    );
  const context = {
    skillTrees,
    hasWeights: hasWeightEquipment(equipment),
    preventionSkills,
  };
  const blocks = picksBlocks.map((block, index) =>
    resolveBlock(type, index, block, context),
  );
  return {
    pool: Object.assign({}, ...blocks.map((block) => block.pool)),
    blocks,
  };
};

import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block, Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { filterBranchesByAgeGroup } from "./ageGroupRule";
import { type BranchDraw, createBranchDraw } from "./branchDraw";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "./equipmentRule";
import { filterBranchesByGender } from "./genderRule";
import type { GenerationInput } from "./generationInput";
import { filterBranchesByPain } from "./painRule";
import {
  type ResolvedPicksBlock,
  resolvePicksBlocks,
} from "./picksBlockResolution";

export interface PicksWorkout {
  /** The union of every picks block pool after the picks workout rules. */
  readonly pool: SkillTreeType;
  /** The resolved picks block per template block; the block walk hands over the same objects. */
  readonly blocks: ReadonlyMap<Block, ResolvedPicksBlock>;
  /** The branch draws of every picks block, built once from the pool above. */
  readonly draw: BranchDraw;
}

// A workout without picks blocks has nothing to draw from.
const NO_BRANCH_DRAW: BranchDraw = Object.freeze({
  single: () => null,
  pair: () => null,
});

export const createEmptyPicksWorkout = (): PicksWorkout =>
  Object.freeze({ pool: {}, blocks: new Map(), draw: NO_BRANCH_DRAW });

const throwWhenPoolEmpty = (
  pool: SkillTreeType,
  subtype: GeneratorError["subtype"],
  params: string[],
): void => {
  if (Object.keys(pool).length === 0) {
    throw { type: "NO_EXERCISES", subtype, params } satisfies GeneratorError;
  }
};

/**
 * Runs pain, equipment, age group and gender on the union pool of a short
 * workout and throws the error of the first family that empties it. Short
 * workouts ignore muscle soreness.
 *
 * filterPoolByPicksWorkoutRules({ "523": <blocked on knee pain> }, kneePainInput)
 * → throws { type: "NO_EXERCISES", subtype: "PAIN", params: ["KNEE"] }
 */
export const filterPoolByPicksWorkoutRules = (
  pool: SkillTreeType,
  input: GenerationInput,
): SkillTreeType => {
  const painResult = filterBranchesByPain(pool, input);
  throwWhenPoolEmpty(
    painResult.keep,
    "PAIN",
    painResult.removals.flatMap((removal) => removal.details),
  );
  const equipmentResult = filterBranchesByEquipment(painResult.keep, input);
  throwWhenPoolEmpty(
    equipmentResult.keep,
    "EQUIPMENT",
    listMissingEquipment(equipmentResult.removals),
  );
  const ageGroupKeep = filterBranchesByAgeGroup(
    equipmentResult.keep,
    input,
  ).keep;
  throwWhenPoolEmpty(ageGroupKeep, "AGE", []);
  const genderKeep = filterBranchesByGender(ageGroupKeep, input).keep;
  throwWhenPoolEmpty(genderKeep, "GENDER", []);
  return genderKeep;
};

/**
 * Resolves the picks blocks of a template, filters their union pool once and
 * builds the branch draws from that pool at the athlete level. A template
 * without picks blocks gets an empty picks workout; one that mixes picks
 * blocks with other kinds throws OTHER/BLOCK_KIND at resolution.
 *
 * resolvePicksWorkout({ blocks: [WU picks block] }, femaleInput)
 * → { pool: { ...WU branches without 1026 }, blocks: Map { WU block → { skill: "WU", ... } }, draw }
 */
export const resolvePicksWorkout = (
  template: Template,
  input: GenerationInput & { readonly athleteLevel: string },
  skillTrees: Readonly<Record<string, SkillTreeType>> = getAllSkillTrees(),
): PicksWorkout => {
  if (!template.blocks.some((block) => block.kind === "picks")) {
    return createEmptyPicksWorkout();
  }
  const resolved = resolvePicksBlocks(template, input, skillTrees);
  const pool = filterPoolByPicksWorkoutRules(resolved.pool, input);
  return {
    pool,
    blocks: new Map(
      template.blocks.map((block, index) => [block, resolved.blocks[index]]),
    ),
    draw: createBranchDraw({
      pool,
      fitnessLevel: input.athleteLevel,
      exerciseCatalog: input.exerciseCatalog,
      exerciseData: input.exerciseData,
      random: input.random,
    }),
  };
};

/**
 * Reads the block that workout setup resolved for a template block.
 *
 * readResolvedPicksBlock(picksWorkout, warmUpBlock) → { skill: "WU", sets: 1, pool: {...}, ... }
 */
export const readResolvedPicksBlock = (
  picksWorkout: PicksWorkout,
  block: Block,
): ResolvedPicksBlock => {
  const resolved = picksWorkout.blocks.get(block);
  if (resolved === undefined) {
    throw new Error(
      `Workout setup resolved no picks block for skill ${block.skill}`,
    );
  }
  return resolved;
};

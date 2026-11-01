import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { ageGroupFor } from "@/features/training/utils/ageUtils";
import { getUserBirthday } from "@/features/training/utils/userDataUtils";
import type { Block } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { filterBranchesByAgeGroup } from "../../ruleFamilies/ageGroupRule";
import type { ResolvedBlockTiming } from "../../setListBuilders/blockTiming";
import type { InterpretedWorkout } from "../../stages/blockWalk";
import { type BranchDraw, createBranchDraw } from "./branchDraw";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "../../ruleFamilies/equipmentRule";
import { filterBranchesByGender } from "../../ruleFamilies/genderRule";
import type { GenerationInput } from "../../generationInput/generationInput";
import { filterBranchesByPain } from "../../ruleFamilies/painRule";
import { throwWhenPoolEmpty } from "../../ruleFamilies/ruleFamily";
import {
  isPicksBlock,
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
  const painResult = filterBranchesByPain(pool, input.athlete);
  throwWhenPoolEmpty(
    painResult.keep,
    "PAIN",
    painResult.removals.flatMap((removal) => removal.details),
  );
  const equipmentResult = filterBranchesByEquipment(
    painResult.keep,
    input.equipment,
  );
  throwWhenPoolEmpty(
    equipmentResult.keep,
    "EQUIPMENT",
    listMissingEquipment(equipmentResult.removals),
  );
  const ageGroupKeep = filterBranchesByAgeGroup(
    equipmentResult.keep,
    ageGroupFor(getUserBirthday(input.athlete)),
  ).keep;
  throwWhenPoolEmpty(ageGroupKeep, "AGE", []);
  const genderKeep = filterBranchesByGender(ageGroupKeep, input.athlete).keep;
  throwWhenPoolEmpty(genderKeep, "GENDER", []);
  return genderKeep;
};

/**
 * Resolves the picks blocks of a template, filters their union pool once and
 * builds the branch draws from that pool at the athlete level. A template
 * without picks blocks gets an empty picks workout, and a block of another
 * kind gets no entry.
 *
 * resolvePicksWorkout({ blocks: [WU picks block] }, femaleInput)
 * → { pool: { ...WU branches without 1026 }, blocks: Map { WU block → { skill: "WU", ... } }, draw }
 */
export const resolvePicksWorkout = (
  template: InterpretedWorkout,
  input: GenerationInput & { readonly athleteLevel: string },
  skillTrees: Readonly<Record<string, SkillTreeType>> = getAllSkillTrees(),
): PicksWorkout => {
  if (!template.blocks.some((block) => block.kind === "picks")) {
    return createEmptyPicksWorkout();
  }
  const resolved = resolvePicksBlocks(template, input, skillTrees);
  const pool = filterPoolByPicksWorkoutRules(resolved.pool, input);
  // resolvePicksBlocks lists one resolved block per picks block, in this order
  const picksBlocks = template.blocks.filter(isPicksBlock);
  return {
    pool,
    blocks: new Map(
      picksBlocks.map((block, index) => [block, resolved.blocks[index]]),
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

/**
 * Reads the timing that workout setup resolved for a template block, without
 * the pool and picks of the block.
 *
 * readResolvedPicksBlockTiming(picksWorkout, warmUpBlock)
 * → { sets: 1, superset: "muscles", rest: {...}, setDuration: undefined, values: undefined }
 */
export const readResolvedPicksBlockTiming = (
  picksWorkout: PicksWorkout,
  block: Block,
): ResolvedBlockTiming => {
  const { sets, superset, rest, setDuration, values } = readResolvedPicksBlock(
    picksWorkout,
    block,
  );
  return { sets, superset, rest, setDuration, values };
};

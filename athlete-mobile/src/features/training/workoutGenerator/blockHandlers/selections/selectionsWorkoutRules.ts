import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { Block, Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { filterBranchesByAgeGroup } from "../../ruleFamilies/ageGroupRule";
import type { ResolvedBlockTiming } from "../../setListBuilders/blockTiming";
import { type BranchDraw, createBranchDraw } from "./branchDraw";
import {
  filterBranchesByEquipment,
  listMissingEquipment,
} from "../../ruleFamilies/equipmentRule";
import { filterBranchesByGender } from "../../ruleFamilies/genderRule";
import type { GenerationInput } from "../../generationInput/generationInput";
import { filterBranchesByPain } from "../../ruleFamilies/painRule";
import {
  type ResolvedSelectionsBlock,
  resolveSelectionsBlocks,
} from "./selectionsBlockResolution";

export interface SelectionsWorkout {
  /** The union of every selections block pool after the selections workout rules. */
  readonly pool: SkillTreeType;
  /** The resolved selections block per template block; the block walk hands over the same objects. */
  readonly blocks: ReadonlyMap<Block, ResolvedSelectionsBlock>;
  /** The branch draws of every selections block, built once from the pool above. */
  readonly draw: BranchDraw;
}

// A workout without selections blocks has nothing to draw from.
const NO_BRANCH_DRAW: BranchDraw = Object.freeze({
  single: () => null,
  pair: () => null,
});

export const createEmptySelectionsWorkout = (): SelectionsWorkout =>
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
 * filterPoolBySelectionsWorkoutRules({ "523": <blocked on knee pain> }, kneePainInput)
 * → throws { type: "NO_EXERCISES", subtype: "PAIN", params: ["KNEE"] }
 */
export const filterPoolBySelectionsWorkoutRules = (
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
 * Resolves the selections blocks of a template, filters their union pool once
 * and builds the branch draws from that pool at the athlete level. A template
 * without selections blocks gets an empty selections workout; one that mixes
 * selections blocks with other kinds throws OTHER/BLOCK_KIND at resolution.
 *
 * resolveSelectionsWorkout({ blocks: [WU selections block] }, femaleInput)
 * → { pool: { ...WU branches without 1026 }, blocks: Map { WU block → { skill: "WU", ... } }, draw }
 */
export const resolveSelectionsWorkout = (
  template: Template,
  input: GenerationInput & { readonly athleteLevel: string },
  skillTrees: Readonly<Record<string, SkillTreeType>> = getAllSkillTrees(),
): SelectionsWorkout => {
  if (!template.blocks.some((block) => block.kind === "picks")) {
    return createEmptySelectionsWorkout();
  }
  const resolved = resolveSelectionsBlocks(template, input, skillTrees);
  const pool = filterPoolBySelectionsWorkoutRules(resolved.pool, input);
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
 * readResolvedSelectionsBlock(selectionsWorkout, warmUpBlock) → { skill: "WU", sets: 1, pool: {...}, ... }
 */
export const readResolvedSelectionsBlock = (
  selectionsWorkout: SelectionsWorkout,
  block: Block,
): ResolvedSelectionsBlock => {
  const resolved = selectionsWorkout.blocks.get(block);
  if (resolved === undefined) {
    throw new Error(
      `Workout setup resolved no selections block for skill ${block.skill}`,
    );
  }
  return resolved;
};

/**
 * Reads the timing that workout setup resolved for a template block, without
 * the pool and selections of the block.
 *
 * readResolvedSelectionsBlockTiming(selectionsWorkout, warmUpBlock)
 * → { sets: 1, superset: "muscles", rest: {...}, setDuration: undefined, values: undefined }
 */
export const readResolvedSelectionsBlockTiming = (
  selectionsWorkout: SelectionsWorkout,
  block: Block,
): ResolvedBlockTiming => {
  const { sets, superset, rest, setDuration, values } =
    readResolvedSelectionsBlock(selectionsWorkout, block);
  return { sets, superset, rest, setDuration, values };
};

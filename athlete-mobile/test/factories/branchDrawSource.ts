import type { BranchDrawSource } from "@/features/training/workoutGenerator/branchDraw";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { generateSequenceRandom } from "./sequenceRandom";

/**
 * Builds the draw source of an ADVANCED athlete without stored branch levels.
 * The pool doubles as the branches the specs draw from, the random returns the
 * draws in order and throws on one more. The overrides replace any field.
 *
 * generateBranchDrawSource({ 1: generateTreeBranch(["e1"]) }, [0.5])
 * → { pool: { 1: ... }, fitnessLevel: "ADVANCED", exerciseCatalog: [],
 *     exerciseData: { exerciseData: {}, branchData: {} }, random: <0.5, then throws> }
 */
export const generateBranchDrawSource = (
  pool: SkillTreeType,
  draws: number[],
  overrides: Partial<BranchDrawSource> = {},
): BranchDrawSource => ({
  pool,
  fitnessLevel: "ADVANCED",
  exerciseCatalog: [],
  exerciseData: { exerciseData: {}, branchData: {} },
  random: generateSequenceRandom(draws),
  ...overrides,
});

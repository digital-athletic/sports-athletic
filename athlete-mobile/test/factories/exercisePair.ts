import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import { generateBranchReference } from "./branchReference";
import { SQUAT_EXERCISE_ID } from "./valueExercise";

export const REGION_TAGS = {
  F: "FULL_BODY",
  L: "LOWER_BODY",
  U: "UPPER_BODY",
  C: "CORE",
};
export type RegionKey = keyof typeof REGION_TAGS;

/**
 * Builds a unit with one two sided exercise in the given region. The region
 * key is one of F, L, U and C, or null for a unit without a region.
 *
 * generateExerciseUnit("legs", "L", "GLUTES")
 * → { first: { branchId: "legs", exerciseId: "elegs", branchTags: ["SIDE_BOTH", "REGION_LOWER_BODY", "MUSCLE_GLUTES"] } }
 */
export const generateExerciseUnit = (
  id: string,
  region: RegionKey | null,
  ...muscles: string[]
): ExercisePair => ({
  first: generateBranchReference(id, [
    ...(region ? [`REGION_${REGION_TAGS[region]}`] : []),
    ...muscles.map((muscle) => `MUSCLE_${muscle}`),
  ]),
});

/**
 * Builds core units that alternate rectus abdominis and obliques.
 *
 * generateCoreUnits(2)
 * → [generateExerciseUnit("core0", "C", "RECTUS_ABDOMINIS"), generateExerciseUnit("core1", "C", "OBLIQUES")]
 */
export const generateCoreUnits = (count: number): ExercisePair[] =>
  Array.from({ length: count }, (_, index) =>
    generateExerciseUnit(
      `core${index}`,
      "C",
      index % 2 ? "OBLIQUES" : "RECTUS_ABDOMINIS",
    ),
  );

/**
 * Builds three big lower body units.
 *
 * generateBigLegUnits()
 * → [generateExerciseUnit("legs1", "L", "GLUTES"), generateExerciseUnit("legs2", "L", "QUADRICEPS"), generateExerciseUnit("legs3", "L", "HAMSTRINGS")]
 */
export const generateBigLegUnits = (): ExercisePair[] => [
  generateExerciseUnit("legs1", "L", "GLUTES"),
  generateExerciseUnit("legs2", "L", "QUADRICEPS"),
  generateExerciseUnit("legs3", "L", "HAMSTRINGS"),
];

/**
 * Builds three small upper body units.
 *
 * generateSmallUpperUnits()
 * → [generateExerciseUnit("arms1", "U", "BICEPS"), generateExerciseUnit("arms2", "U", "TRICEPS"), generateExerciseUnit("arms3", "U", "SHOULDER_FRONT")]
 */
export const generateSmallUpperUnits = (): ExercisePair[] => [
  generateExerciseUnit("arms1", "U", "BICEPS"),
  generateExerciseUnit("arms2", "U", "TRICEPS"),
  generateExerciseUnit("arms3", "U", "SHOULDER_FRONT"),
];

/**
 * Builds three big upper body units.
 *
 * generateBigUpperUnits()
 * → [generateExerciseUnit("push", "U", "CHEST"), generateExerciseUnit("pull", "U", "LATISSIMUS"), generateExerciseUnit("back", "U", "UPPER_BACK")]
 */
export const generateBigUpperUnits = (): ExercisePair[] => [
  generateExerciseUnit("push", "U", "CHEST"),
  generateExerciseUnit("pull", "U", "LATISSIMUS"),
  generateExerciseUnit("back", "U", "UPPER_BACK"),
];

/**
 * Builds a pair whose lead is the exercise on the branch. The exercise is the
 * squat unless the exercise ID is given.
 *
 * generateLeadPair("b1")
 * → { first: { branchId: "b1", exerciseId: "26", branchTags: ["SIDE_BOTH"] } }
 */
export const generateLeadPair = (
  branchId: string,
  exerciseId = SQUAT_EXERCISE_ID,
): ExercisePair => ({
  first: generateBranchReference(branchId, [], exerciseId),
});
